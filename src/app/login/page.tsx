'use client'

import { createBrowserClient } from '@supabase/ssr'

export default function PanelHome() {
  const redirectNext = '/panel';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectNext)}`,
      },
    })
  };

  return (
    <button 
      onClick={handleLogin}
      className="px-4 py-2 bg-black text-white rounded-md"
    >
      Sign in with Google
    </button>
  );
}