import { Link } from 'expo-router';
import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useForecast, useUpcoming } from '@/api/queries';
import { Forecast } from '@/api/types';
import { Money } from '@/components/Money';
import { dayOfMonth, fullDate, money } from '@/lib/format';
import { colors, fonts, space, tabular } from '@/theme/tokens';

const CHART_HEIGHT = 38;

function sentenceFor(forecast: Forecast): string {
  const lowest = forecast.lowestPoint;
  const closing = money(forecast.projectedBalance);

  if (!lowest) {
    return `fecha o mês em ${closing}.`;
  }

  if (Number(lowest.balance) < 0) {
    return `não passa. No dia ${dayOfMonth(lowest.date)} você fura em ${money(Math.abs(Number(lowest.balance)))}.`;
  }

  if (lowest.date === forecast.until) {
    return `passa. Fecha o mês em ${closing}, que é o ponto mais baixo do caminho.`;
  }

  return `passa. No dia ${dayOfMonth(lowest.date)} você chega no fundo, com ${money(lowest.balance)}, e fecha em ${closing}.`;
}

function Sparkline({ forecast, alarm }: { forecast: Forecast; alarm: boolean }) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const points = forecast.daily;

  if (points.length < 2) {
    return <View onLayout={onLayout} style={{ height: CHART_HEIGHT }} />;
  }

  const values = points.map((point) => Number(point.balance));
  const top = Math.max(...values, 0);
  const bottom = Math.min(...values, 0);
  const span = top - bottom || 1;

  const x = (index: number) => (index / (points.length - 1)) * width;
  const y = (value: number) => CHART_HEIGHT - 8 - ((value - bottom) / span) * (CHART_HEIGHT - 16);

  const path = values
    .map(
      (value, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`,
    )
    .join(' ');

  const lowestIndex = values.indexOf(Math.min(...values));

  return (
    <View onLayout={onLayout} style={{ height: CHART_HEIGHT }}>
      {width > 0 ? (
        <Svg width={width} height={CHART_HEIGHT}>
          <Path
            d={path}
            fill="none"
            stroke={alarm ? colors.brick : colors.rule}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx={x(lowestIndex)}
            cy={y(values[lowestIndex] as number)}
            r={3}
            fill={colors.paper}
            stroke={alarm ? colors.brick : colors.ink}
            strokeWidth={1.5}
          />
        </Svg>
      ) : null}
    </View>
  );
}

export function MonthOutlook() {
  const forecast = useForecast();
  const upcoming = useUpcoming();

  const data = forecast.data;
  const alarm = data?.lowestPoint ? Number(data.lowestPoint.balance) < 0 : false;

  const overdue = upcoming.data?.overdue;
  const coming = upcoming.data?.upcoming;
  const hasDue = Boolean((overdue?.items.length ?? 0) > 0 || (coming?.items.length ?? 0) > 0);

  return (
    <>
      {data ? (
        <View style={styles.block}>
          <Text style={styles.label}>passo o mês?</Text>
          <Text style={[styles.sentence, alarm ? styles.sentenceAlarm : null]}>
            {sentenceFor(data)}
          </Text>
          <Sparkline forecast={data} alarm={alarm} />
          {data.truncated ? (
            <Text style={styles.truncated}>
              {`a previsão só alcança ${fullDate(data.until)} — depois disso as repetições ainda não estão geradas`}
            </Text>
          ) : null}
        </View>
      ) : null}

      {hasDue ? (
        <Link href="/a-pagar" asChild>
          <Pressable style={styles.block}>
            <View style={styles.dueHead}>
              <Text style={styles.label}>a pagar</Text>
              <Text style={styles.window}>nos próximos 7 dias</Text>
            </View>

            {(overdue?.items.length ?? 0) > 0 ? (
              <View style={styles.dueRow}>
                <Text style={styles.overdueLabel}>
                  {overdue?.items.length === 1
                    ? '1 já venceu'
                    : `${overdue?.items.length} já venceram`}
                </Text>
                <Money style={styles.overdueValue}>{`-${money(overdue?.total ?? 0)}`}</Money>
              </View>
            ) : null}

            {(coming?.items.length ?? 0) > 0 ? (
              <View style={styles.dueRow}>
                <Text style={styles.comingLabel}>
                  {coming?.items.length === 1
                    ? '1 vence esta semana'
                    : `${coming?.items.length} vencem esta semana`}
                </Text>
                <Money style={styles.comingValue}>{`-${money(coming?.total ?? 0)}`}</Money>
              </View>
            ) : null}
          </Pressable>
        </Link>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.ruleHair,
    gap: 10,
  },
  label: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
  sentence: {
    fontFamily: fonts.serifItalic,
    fontSize: 17,
    lineHeight: 25,
    color: colors.ink,
  },
  sentenceAlarm: { color: colors.brick },
  truncated: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.inkGhost },
  dueHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  window: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    minHeight: space.touch - 20,
  },
  overdueLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.brick },
  overdueValue: { fontSize: 14, color: colors.brick, ...tabular },
  comingLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted },
  comingValue: { fontSize: 14, color: colors.inkMuted, ...tabular },
});
