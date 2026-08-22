import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown } from '@/components/icons';
import { Field } from '@/components/Field';
import { fullDate } from '@/lib/format';
import { tabular, type } from '@/theme/tokens';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  hint?: string;
}

function toLocalDate(iso: string): Date {
  const source = new Date(iso);
  return new Date(source.getUTCFullYear(), source.getUTCMonth(), source.getUTCDate());
}

function toUtcIso(local: Date): string {
  return new Date(
    Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()),
  ).toISOString();
}

export function DateField({ label, value, onChange, hint }: DateFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <Field label={label} hint={hint}>
      <Pressable style={styles.row} onPress={() => setOpen(true)}>
        <Text style={[type.field, tabular]}>{fullDate(value)}</Text>
        <ChevronDown size={9} />
      </Pressable>

      {open ? (
        <View>
          <DateTimePicker
            value={toLocalDate(value)}
            mode="date"
            display="default"
            onChange={(event, picked) => {
              setOpen(false);
              if (event.type === 'set' && picked) {
                onChange(toUtcIso(picked));
              }
            }}
          />
        </View>
      ) : null}
    </Field>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
