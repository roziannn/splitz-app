import { useRouter } from 'expo-router';
import { Onboarding } from '../components/Onboarding';

export default function Tutorial() {
  const router = useRouter();
  return <Onboarding doneLabel="Selesai" onDone={() => router.back()} />;
}
