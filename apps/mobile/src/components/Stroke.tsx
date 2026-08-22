import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const ANCHORS = [
  [1, 6.2],
  [22, 3],
  [44, 4.4],
  [64, 5.2],
  [78, 5.8],
  [90, 4],
  [99, 2.8],
] as const;

function pathFor(width: number): string {
  const x = (value: number) => ((value / 100) * width).toFixed(2);
  const [start, c1, c2, mid, c3, c4, end] = ANCHORS;
  return [
    `M${x(start[0])} ${start[1]}`,
    `C${x(c1[0])} ${c1[1]} ${x(c2[0])} ${c2[1]} ${x(mid[0])} ${mid[1]}`,
    `C${x(c3[0])} ${c3[1]} ${x(c4[0])} ${c4[1]} ${x(end[0])} ${end[1]}`,
  ].join(' ');
}

interface StrokeProps {
  color: string;
  width: number;
  thickness?: number;
}

export function Stroke({ color, width, thickness = 3 }: StrokeProps) {
  const height = thickness * 3;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} 9`} style={styles.svg}>
      <Path
        d={pathFor(width)}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  svg: { display: 'flex' },
});
