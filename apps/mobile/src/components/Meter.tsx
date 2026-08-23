import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Stroke } from '@/components/Stroke';
import { colors } from '@/theme/tokens';

interface MeterProps {
  color: string;
  spent: number;
  committed: number;
}

function clamp(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(1, value);
}

export function Meter({ color, spent, committed }: MeterProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const committedWidth = width * clamp(committed);
  const spentWidth = width * clamp(spent);

  return (
    <View onLayout={onLayout} style={styles.track}>
      {width > 0 ? (
        <>
          <Stroke color={colors.ruleSoft} width={width} />
          {committedWidth > 0 ? (
            <View style={[styles.layer, styles.promised]}>
              <Stroke color={color} width={committedWidth} />
            </View>
          ) : null}
          {spentWidth > 0 ? (
            <View style={styles.layer}>
              <Stroke color={color} width={spentWidth} />
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 9 },
  layer: { position: 'absolute', left: 0, top: 0 },
  promised: { opacity: 0.42 },
});
