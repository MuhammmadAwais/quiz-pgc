/**
 * Text utility functions for multilingual support (English, Islamiat Arabic, Urdu, Math).
 */

const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Detects if a given string contains Arabic or Urdu RTL characters.
 */
export function isRTL(text?: string | null): boolean {
  if (!text) return false;
  return RTL_REGEX.test(text);
}

/**
 * Returns directional attribute and CSS class for proper script rendering.
 */
export function getTextDirectionProps(text?: string | null) {
  const rtl = isRTL(text);
  return {
    dir: rtl ? ('rtl' as const) : ('ltr' as const),
    className: rtl ? 'font-rtl text-right leading-[1.8]' : 'text-left',
  };
}
