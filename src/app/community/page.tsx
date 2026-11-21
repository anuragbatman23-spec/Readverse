'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommunityPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?tab=feed');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-3 border-[#DA6569] border-t-transparent animate-spin" />
    </div>
  );
}
