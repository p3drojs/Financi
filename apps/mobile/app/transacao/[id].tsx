import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Stroke } from '@/components/Stroke';
import { ChevronDown, ChevronLeft, RepeatIcon } from '@/components/icons';
import { dayOfMonth, fullDate, money, repeatLabel } from '@/lib/format';
import { recurrenceById, transactionById } from '@/mock/data';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, tabular, type } from '@/theme/tokens';

export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const item = transactionById(id);
  const color = onPaper(item.category.color);
  const recurrence = item.recurrenceId ? recurrenceById(item.recurrenceId) : undefined;
  const day = dayOfMonth(item.date);

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ChevronLeft />
        </Pressable>
        <Text style={type.title}>{day}</Text>
      </View>

      {recurrence ? (
        <ScopeNote
          text={`isto ${repeatLabel(recurrence.intervalMonths)}. o que você mudar aqui vale só para ${day}.`}
          linkLabel="mudar a repetição inteira"
          href="/repeticoes"
        />
      ) : null}

      {item.installmentGroupId && item.installmentNumber && item.installmentTotal ? (
        <ScopeNote
          text={`isto é a parcela ${item.installmentNumber} de ${item.installmentTotal}. o que você mudar aqui vale só para ${day}.`}
          linkLabel="ver o parcelamento inteiro"
          href={`/parcelamento/${item.installmentGroupId}`}
        />
      ) : null}

      <View style={styles.fields}>
        <Field label="o que foi">
          <Text style={type.field}>{item.description}</Text>
        </Field>

        <Field label="quanto">
          <View style={styles.amountRow}>
            <Text style={styles.currency}>R$</Text>
            <Text style={styles.amount}>{money(item.amount)}</Text>
          </View>
        </Field>

        <Field label="em que categoria">
          <View style={styles.categoryRow}>
            <View style={styles.categoryName}>
              <Stroke color={color} width={20} />
              <Text style={type.field}>{item.category.name}</Text>
            </View>
            <ChevronDown size={9} />
          </View>
        </Field>

        <Field label="quando">
          <Text style={[type.field, tabular]}>{fullDate(item.date)}</Text>
        </Field>

        <Field label="etiquetas">
          <View style={styles.tags}>
            {item.tags.map((link) => (
              <Text key={link.tagId} style={type.field}>
                {link.tag.name}
              </Text>
            ))}
            <Text style={styles.tagPlaceholder}>
              {item.tags.length > 0 ? 'escrever outra' : 'escrever uma'}
            </Text>
          </View>
        </Field>
      </View>

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <Pressable style={styles.save}>
          <Text style={styles.saveLabel}>guardar</Text>
        </Pressable>
        <Pressable style={styles.delete}>
          <Text style={styles.deleteLabel}>apagar este</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

interface ScopeNoteProps {
  text: string;
  linkLabel: string;
  href: string;
}

function ScopeNote({ text, linkLabel, href }: ScopeNoteProps) {
  return (
    <View style={styles.note}>
      <View style={styles.noteIcon}>
        <RepeatIcon color={colors.inkMuted} />
      </View>
      <View style={styles.noteBody}>
        <Text style={type.note}>{text}</Text>
        <Link href={href} asChild>
          <Pressable style={styles.noteLink}>
            <Text style={styles.noteLinkLabel}>{linkLabel}</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  header: { height: 30, flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -14 },
  back: {
    width: space.touch,
    height: space.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { marginTop: 22, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  noteIcon: { marginTop: 3 },
  noteBody: { flexGrow: 1, flexShrink: 1, gap: 8 },
  noteLink: { minHeight: space.touch, justifyContent: 'center', alignSelf: 'flex-start' },
  noteLinkLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.sage,
    borderBottomWidth: 1,
    borderBottomColor: colors.sageRule,
    paddingBottom: 2,
  },
  fields: { marginTop: 34, gap: 28 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  currency: { fontFamily: fonts.serif, fontSize: 16, color: colors.inkFaint },
  amount: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.7,
    color: colors.ink,
    ...tabular,
  },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryName: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  tagPlaceholder: { fontFamily: fonts.sans, fontSize: 17, color: colors.inkGhost },
  spacer: { flexGrow: 1, minHeight: 40 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  save: {
    flexGrow: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  delete: { height: 52, paddingHorizontal: 8, justifyContent: 'center' },
  deleteLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.brick },
});
