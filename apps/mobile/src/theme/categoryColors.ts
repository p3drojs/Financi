const CANVAS_VARIANTS: Record<string, string> = {
  '#2E7D32': '#6FBF74',
  '#00897B': '#4FC7B6',
  '#1565C0': '#6BA6EA',
  '#6D4C41': '#C29A8C',
  '#E65100': '#FF9A4D',
  '#4E342E': '#BB9086',
  '#0277BD': '#57ACE8',
  '#C62828': '#F27C7C',
  '#5E35B1': '#A98BE8',
  '#AD1457': '#E87BA8',
  '#F9A825': '#F9C063',
  '#37474F': '#9AACB6',
  '#616161': '#ABABAB',
};

const TARGET_LIGHTNESS = 0.7;
const FALLBACK = '#ABABAB';

function toHsl(hex: string): { h: number; s: number; l: number } | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const value = parseInt(match[1] as string, 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) return { h: 0, s: 0, l };

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  return { h: (h * 60 + 360) % 360, s, l };
}

function toHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  const channel = (value: number) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

export function onPaper(hex: string | null | undefined): string {
  if (!hex) return FALLBACK;

  const preset = CANVAS_VARIANTS[hex.toUpperCase()];
  if (preset) return preset;

  const hsl = toHsl(hex);
  if (!hsl) return FALLBACK;

  return toHex(hsl.h, Math.max(hsl.s, 0.35), TARGET_LIGHTNESS);
}
