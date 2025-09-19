'use client';

import { MouseEvent } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Props = {
  variant?: 'primary' | 'outline';
  label?: string;
};

/**
 * Client component to avoid the "dead button" issue.
 * - Provides both programmatic navigation and a Link fallback.
 */
export default function CreateEventButton({
  variant = 'primary',
  label = 'Create first event',
}: Props) {
  const router = useRouter();

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    // Prevent form submissions swallowing the click
    e.preventDefault();
    e.stopPropagation();
    router.push('/events/new');
  }

  const base = 'inline-flex items-center justify-center rounded-xl text-sm font-semibold px-4 py-2';
  const cls =
    variant === 'outline'
      ? `${base} border border-gray-300 bg-white hover:bg-gray-50`
      : `${base} bg-black text-white hover:opacity-90`;

  return (
    <>
      <button type="button" onClick={handleClick} data-testid="create-first-event" className={cls}>
        {label}
      </button>
      {/* Link fallback for non-JS/SSR edge cases */}
      <noscript>
        <div>
          <a href="/events/new">Create first event</a>
        </div>
      </noscript>
      <div className="sr-only">
        <Link href="/events/new">Create first event</Link>
      </div>
    </>
  );
}
