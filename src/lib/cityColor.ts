export interface CityColor {
  /** Light fill for the block background. */
  bg: string;
  /** Slightly deeper fill used on hover. */
  bgHover: string;
  /** Border tint. */
  border: string;
  /** Title text colour (dark, high contrast). */
  text: string;
  /** Secondary text colour (time / room). */
  sub: string;
  /** Saturated accent for dots / markers. */
  accent: string;
}

/**
 * Deterministic hue from a string (djb2). Returns 0–359.
 */
function hueFromString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33 + value.charCodeAt(i)) | 0;
  }
  return ((hash % 360) + 360) % 360;
}

/**
 * Maps a studio city to a harmonious colour set. Saturation and lightness are
 * fixed so every city reads as a soft pastel that fits the light/blue theme –
 * only the hue rotates. Missing cities fall back to the app's blue (~217°).
 */
export function cityColor(city?: string | null): CityColor {
  const hue = city && city.trim() ? hueFromString(city.trim().toLowerCase()) : 217;
  return {
    bg: `hsl(${hue} 70% 96.5%)`,
    bgHover: `hsl(${hue} 70% 92.5%)`,
    border: `hsl(${hue} 55% 85%)`,
    text: `hsl(${hue} 48% 32%)`,
    sub: `hsl(${hue} 38% 46%)`,
    accent: `hsl(${hue} 62% 55%)`,
  };
}
