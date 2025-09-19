import { redirect } from 'next/navigation';

export default function HomePage() {
  // Remove homepage - redirect to login
  redirect('/login');
}
