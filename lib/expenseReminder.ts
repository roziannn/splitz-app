import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { loadReceipts } from './storage';
import { localIso } from './dates';

const TASK_NAME = 'splitz-expense-reminder-check';
const ENABLED_KEY = 'splitz.reminder.enabled.v1';
const LAST_CHECK_KEY = 'splitz.reminder.last-notified.v1';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const CHANNEL_ID = 'expense-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function prepareNotifications() {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Pengingat pengeluaran',
    description: 'Pengingat jika belum ada pengeluaran yang dicatat hari ini.',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0f766e',
  });
}

export async function isExpenseReminderEnabled() {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === '1';
}

export async function enableExpenseReminder(): Promise<boolean> {
  await prepareNotifications();
  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) permissions = await Notifications.requestPermissionsAsync();
  if (!permissions.granted) return false;

  await AsyncStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
  await AsyncStorage.setItem(ENABLED_KEY, '1');
  try {
    if (!(await TaskManager.isTaskRegisteredAsync(TASK_NAME))) {
      await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 6 * 60 });
    }
  } catch (error) {
    await AsyncStorage.setItem(ENABLED_KEY, '0');
    throw error;
  }
  return true;
}

export async function disableExpenseReminder() {
  await AsyncStorage.setItem(ENABLED_KEY, '0');
  if (await TaskManager.isTaskRegisteredAsync(TASK_NAME)) {
    await BackgroundTask.unregisterTaskAsync(TASK_NAME);
  }
}

export async function ensureExpenseReminderRegistered() {
  if (!(await isExpenseReminderEnabled())) return;
  await prepareNotifications();
  if (!(await AsyncStorage.getItem(LAST_CHECK_KEY))) {
    await AsyncStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
  }
  if (!(await TaskManager.isTaskRegisteredAsync(TASK_NAME))) {
    await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 6 * 60 });
  }
}

export async function checkExpenseReminder() {
  if (!(await isExpenseReminderEnabled())) return;
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) return;

  const lastNotified = Number(await AsyncStorage.getItem(LAST_CHECK_KEY)) || 0;
  if (Date.now() - lastNotified < CHECK_INTERVAL_MS) return;
  const receipts = await loadReceipts();
  if (receipts.some((receipt) => receipt.date === localIso())) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Belum ada pengeluaran hari ini',
      body: 'Jangan lupa mencatat pengeluaranmu di Splitz.',
      sound: true,
    },
    trigger: { channelId: CHANNEL_ID },
  });
  await AsyncStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
}

// Task harus didefinisikan di scope modul agar Android dapat menjalankannya
// setelah aplikasi masuk ke background atau prosesnya dibuat ulang.
if (!TaskManager.isTaskDefined(TASK_NAME)) {
  TaskManager.defineTask(TASK_NAME, async () => {
    try {
      await checkExpenseReminder();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}
