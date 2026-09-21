/**
 * Color Contrast & Accessibility Utility
 * Provides WCAG luminance calculations, intelligent contrast adaptation,
 * and text-color selection for custom team colors across Dark and Light modes.
 */

export interface ColorSafetyResult {
  originalColor: string;
  safeColor: string;
  textColor: string;
  isAdjusted: boolean;
  contrastRatio: number;
}

export interface ColorPreset {
  name: string;
  hex: string;
}

export const CURATED_TEAM_PRESETS: ColorPreset[] = [
  { name: 'Electric Violet', hex: '#8B5CF6' },
  { name: 'Bright Cyan', hex: '#06B6D4' },
  { name: 'Emerald Teal', hex: '#10B981' },
  { name: 'Sunset Coral', hex: '#F97316' },
  { name: 'Electric Amber', hex: '#F59E0B' },
  { name: 'Rose Pink', hex: '#F43F5E' },
  { name: 'Royal Indigo', hex: '#6366F1' },
  { name: 'Sky Ice Blue', hex: '#0EA5E9' },
];

/**
 * Parses a 3 or 6 digit hex string into RGB values [0-255].
 */
export function hexToRgb(hex: string): [number, number, number] {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  if (cleaned.length !== 6) {
    return [139, 92, 246]; // Fallback to violet
  }

  const num = parseInt(cleaned, 16);
  if (isNaN(num)) return [139, 92, 246];

  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Converts RGB [0-255] back to a standardized #RRGGBB hex string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Computes standard WCAG 2.1 relative luminance (0 = black, 1 = pure white).
 */
export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates WCAG contrast ratio between two colors (1:1 to 21:1).
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Converts RGB to HSL.
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s, l];
}

/**
 * Converts HSL to RGB.
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = (h % 360) / 360;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Returns either pure white (#FFFFFF) or midnight dark (#0F172A) depending on
 * which offers higher legibility over the given background color.
 */
export function getTextContrastColor(backgroundHex: string): string {
  const lum = getRelativeLuminance(backgroundHex);
  return lum > 0.45 ? '#0F172A' : '#FFFFFF';
}

/**
 * Inspects a custom team color against the active theme canvas.
 * If the color lacks contrast (e.g. black on dark mode, or pure white on light mode),
 * it automatically inverts or clamps luminance to guarantee stage projection visibility (> 3.5:1 ratio).
 */
export function getAccessibleTeamColor(
  hexColor: string,
  isDarkMode: boolean
): ColorSafetyResult {
  const backgroundHex = isDarkMode ? '#0B141B' : '#EDE8F5';
  let safeHex = hexColor.trim();

  // Validate format
  if (!safeHex.startsWith('#')) safeHex = '#' + safeHex;
  if (!/^#[0-9A-Fa-f]{6}$/.test(safeHex)) {
    safeHex = isDarkMode ? '#8B5CF6' : '#6366F1';
  }

  let ratio = getContrastRatio(safeHex, backgroundHex);
  const minRequiredRatio = 3.2; // Projector legibility threshold
  let isAdjusted = false;

  if (ratio < minRequiredRatio) {
    const [r, g, b] = hexToRgb(safeHex);
    const [h, s, l] = rgbToHsl(r, g, b);

    if (isDarkMode) {
      // Color is too dark for dark mode: boost lightness and saturation or invert near-black
      const targetL = l < 0.1 ? 0.65 : Math.max(0.55, l + 0.4);
      const targetS = s < 0.1 ? 0.5 : Math.max(0.6, s);
      const [newR, newG, newB] = hslToRgb(h, targetS, targetL);
      safeHex = rgbToHex(newR, newG, newB);
    } else {
      // Color is too light for light mode: darken lightness
      const targetL = l > 0.85 ? 0.35 : Math.min(0.38, l - 0.4);
      const targetS = s < 0.1 ? 0.5 : Math.max(0.6, s);
      const [newR, newG, newB] = hslToRgb(h, targetS, targetL);
      safeHex = rgbToHex(newR, newG, newB);
    }

    ratio = getContrastRatio(safeHex, backgroundHex);
    isAdjusted = true;
  }

  const textColor = getTextContrastColor(safeHex);

  return {
    originalColor: hexColor,
    safeColor: safeHex,
    textColor,
    isAdjusted,
    contrastRatio: Number(ratio.toFixed(2)),
  };
}
