/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface GoogleSignInButtonProps {
  clientId: string;
  onSuccess: (credential: string) => void;
}

/**
 * Renders the official Google Identity Services "Continue with Google" button.
 * On success it hands the ID token (credential) to `onSuccess`, which the app
 * verifies server-side. Requires the GIS script (loaded in index.html) and a
 * valid OAuth Web Client ID.
 */
export default function GoogleSignInButton({ clientId, onSuccess }: GoogleSignInButtonProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onSuccess);
  cbRef.current = onSuccess;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    const init = (): boolean => {
      const g = (window as any).google;
      if (!g?.accounts?.id || !divRef.current) return false;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: any) => {
          if (resp?.credential) cbRef.current(resp.credential);
        },
      });
      divRef.current.innerHTML = '';
      g.accounts.id.renderButton(divRef.current, {
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'center',
        width: Math.min(400, divRef.current.offsetWidth || 320),
      });
      return true;
    };

    if (init()) return () => { cancelled = true; };

    // GIS script may still be loading — retry briefly.
    const iv = setInterval(() => {
      if (!cancelled && init()) clearInterval(iv);
    }, 300);
    const to = setTimeout(() => clearInterval(iv), 8000);
    return () => { cancelled = true; clearInterval(iv); clearTimeout(to); };
  }, [clientId]);

  return <div ref={divRef} className="w-full flex justify-center min-h-[44px]" />;
}
