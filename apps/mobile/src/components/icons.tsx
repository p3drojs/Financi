import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/tokens';

interface IconProps {
  color?: string;
  size?: number;
}

export function RepeatIcon({ color = colors.inkFaint, size = 15 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M3 8a5 5 0 0 1 8.6-3.5M13 8a5 5 0 0 1-8.6 3.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M11.6 1.9v2.8H8.8M4.4 14.1v-2.8h2.8"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronLeft({ color = colors.inkMuted }: IconProps) {
  return (
    <Svg width={9} height={15} viewBox="0 0 9 15" fill="none">
      <Path
        d="M7.5 1.5 1.5 7.5l6 6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronRight({ color = colors.rule }: IconProps) {
  return (
    <Svg width={9} height={15} viewBox="0 0 9 15" fill="none">
      <Path
        d="m1.5 1.5 6 6-6 6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronDown({ color = colors.inkFaint, size = 8 }: IconProps) {
  return (
    <Svg width={size} height={(size * 5) / 8} viewBox="0 0 8 5" fill="none">
      <Path
        d="m1 1 3 3 3-3"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusIcon({ color = colors.ink, size = 17 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M9 2v14M2 9h14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function StepPlus({ color = colors.inkMuted }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M7 1v12M1 7h12" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function StepMinus({ color = colors.inkMuted }: IconProps) {
  return (
    <Svg width={14} height={2} viewBox="0 0 14 2" fill="none">
      <Path d="M1 1h12" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function TransferIcon({ color = colors.inkFaint, size = 15 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M2.5 5.5h11M11 3l2.5 2.5L11 8"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.5 10.5h-11M5 8l-2.5 2.5L5 13"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckIcon({ color = colors.paper, size = 10 }: IconProps) {
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 10 8" fill="none">
      <Path
        d="M1 4.2 3.7 6.8 9 1.4"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
