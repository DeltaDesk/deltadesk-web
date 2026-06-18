const AVATAR_SATURATION = 65;
const AVATAR_LIGHTNESS = 55;

export function hashHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

export function avatarColors(id: string): { background: string; foreground: string } {
  const hue = hashHue(id);
  return {
    background: `hsl(${hue}, ${AVATAR_SATURATION}%, ${AVATAR_LIGHTNESS}%)`,
    foreground: "#ffffff",
  };
}

export function getInitials(name: string): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "XX";

  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}
