import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/session';

export default async function Home() {
  const session = await getServerSession();

  // If user is already logged in, redirect based on onboarding status
  if (session?.sub) {
    if (!session.onboardingComplete) {
      return redirect('/onboarding');
    }
    return redirect('/dashboard');
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Fresh</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your modern scheduling and team management platform
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Get Started
          </Link>

          <div className="text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in here
            </Link>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-400">
          <p>Fresh - Simple, powerful, and intuitive</p>
        </div>
      </div>
    </div>
  );
}
