'use client';

import { useAuth } from '@/hooks/useAuth';
import { getDevModeBanner } from '@/lib/dev-mode';

export function DevModeBanner() {
  const { user } = useAuth();
  const banner = getDevModeBanner(user?.email);

  if (!banner?.show) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <span>{banner.message}</span>
        <span className="text-blue-200">| Elite Tier | Unlimited Access</span>
      </div>
    </div>
  );
}

export default DevModeBanner;