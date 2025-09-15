import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/session';

export default async function Home() {
  const session = await getServerSession();

  if (!session?.sub) {
    return redirect('/login');
  }

  if (!session.onboardingComplete) {
    return redirect('/onboarding');
  }

  return redirect('/dashboard');
}
