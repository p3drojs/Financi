import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/tokens';

function pathFor(width: number): string {
  const step = width / 6;
  const y = [3.4, 1.8, 4.4, 3, 1.6, 4.8, 3.2, 2, 4, 2.6];
  const x = (index: number) => (index * step).toFixed(2);
  return [
    `M0 ${y[0]}`,
    `C${x(0.7)} ${y[1]} ${x(1.4)} ${y[2]} ${x(2.1)} ${y[3]}`,
    `C${x(2.9)} ${y[4]} ${x(3.5)} ${y[5]} ${x(4.2)} ${y[6]}`,
    `C${x(5.2)} ${y[7]} ${x(5.6)} ${y[8]} ${x(6)} ${y[9]}`,
  ].join(' ');
}

export function WavyRule() {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View onLayout={onLayout} style={{ height: 6 }}>
      {width > 0 ? (
        <Svg width={width} height={6} viewBox={`0 0 ${width} 6`}>
          <Path
            d={pathFor(width)}
            fill="none"
            stroke={colors.ruleSoft}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </Svg>
      ) : null}
    </View>
  );
}
