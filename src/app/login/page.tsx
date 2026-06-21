'use client'

import { createBrowserClient } from '@supabase/ssr'
import { IconBrandGoogle, IconTriangle } from '@tabler/icons-react'

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
        redirectTo: `${window.location.origin}/signInWithOAuth?next=${encodeURIComponent(redirectNext)}`,
      },
    })
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <IconTriangle size={32} stroke={2} className="text-blue-500 inline mb-1.5" />
            <h1 className="font-space-grotesk text-2xl font-semibold text-gray-900 tracking-tight">DeltaDesk</h1>
            <p className="mt-2 text-sm text-gray-500">Melde dich an, um fortzufahren.</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <button
              onClick={handleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow active:scale-[0.98]"
            >
              <IconBrandGoogle size={18} className="text-gray-500" />
              Mit Google anmelden
            </button>
            <p className="mt-4 text-xs text-gray-500">
              Sichere Anmeldung über Google OAuth. Deine Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}