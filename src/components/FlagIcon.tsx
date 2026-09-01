/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Real flag images (flagcdn.com) instead of Unicode flag emoji — Windows
// desktop browsers have no built-in flag glyphs, so emoji flags render as
// blank boxes or letter pairs there even though they work fine on mobile.

const NAME_TO_CODE: Record<string, string> = {
  USA: 'US', UK: 'GB', 'UNITED KINGDOM': 'GB', 'UNITED STATES': 'US', CANADA: 'CA'
};

function resolveCode(code?: string, name?: string): string {
  let cc = (code || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc) && name) cc = NAME_TO_CODE[name.toUpperCase()] || '';
  return /^[A-Z]{2}$/.test(cc) ? cc : '';
}

interface FlagIconProps {
  code?: string;   // ISO-2 country code, e.g. "US"
  name?: string;   // fallback legacy country name, e.g. "USA"
  className?: string;
}

export default function FlagIcon({ code, name, className = 'w-6 h-4' }: FlagIconProps) {
  const cc = resolveCode(code, name);
  if (!cc) {
    return <span className={`inline-flex items-center justify-center ${className}`}>🌐</span>;
  }
  const lc = cc.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w40/${lc}.png`}
      srcSet={`https://flagcdn.com/w40/${lc}.png 1x, https://flagcdn.com/w80/${lc}.png 2x`}
      alt={cc}
      title={cc}
      className={`inline-block object-cover rounded-[2px] shrink-0 ${className}`}
      loading="lazy"
    />
  );
}
