/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Copy text to the clipboard, working in both secure (HTTPS/localhost) and
 * insecure (plain HTTP) contexts.
 *
 * `navigator.clipboard` is only available in secure contexts, so on a plain-HTTP
 * deployment it is undefined and the modern API throws. We fall back to the
 * legacy `document.execCommand('copy')` via an off-screen textarea.
 *
 * @returns true if the copy succeeded.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern API — only works over HTTPS or on localhost.
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy path
    }
  }

  // Legacy fallback for insecure (HTTP) contexts.
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
