import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Category, TransactionType } from '@/api/types';
import { BackHeader } from '@/components/BackHeader';
import { Screen } from '@/components/Screen';
import { Stroke } from '@/components/Stroke';
import { ChevronRight } from '@/components/icons';
import { categories } from '@/mock/data';
import { onPaper } from '@/theme/categoryColors';
import { colors, fonts, space, type } from '@/theme/tokens';

const SECTIONS: { type: TransactionType; title: string }[] = [
  { type: 'INCOME', title: 'o que entra' },
  { type: 'EXPENSE', title: 'o que sai' },
];

export default function CategoriesScreen() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="categorias" />

      <Text style={styles.note}>
        o tipo é escolhido na criação e não muda depois — um lançamento só aceita categoria do
        mesmo tipo.
      </Text>

      {SECTIONS.map((section) => {
        const items = categories.filter((item) => item.type === section.type);

        return (
          <View key={section.type} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={type.label}>{section.title}</Text>
              <Text style={type.caption}>{items.length}</Text>
            </View>
            {items.map((item) => (
              <CategoryRow key={item.id} item={item} />
            ))}
          </View>
        );
      })}

      <Link href="/categoria/nova" asChild>
        <Pressable style={styles.create}>
          <Text style={styles.createLabel}>escrever uma categoria nova</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

function CategoryRow({ item }: { item: Category }) {
  return (
    <Link href={`/categoria/${item.id}`} asChild>
      <Pressable style={styles.row}>
        <Stroke color={onPaper(item.color)} width={24} />
        <Text style={styles.rowLabel}>{item.name}</Text>
        <ChevronRight color={colors.ruleSoft} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 40 },
  note: {
    marginTop: 20,
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 23,
    color: colors.inkMuted,
  },
  section: { marginTop: 30 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleHair,
  },
  rowLabel: { flexGrow: 1, fontFamily: fonts.sans, fontSize: 16, color: colors.ink },
  create: { marginTop: 30, minHeight: space.touch, justifyContent: 'center' },
  createLabel: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.sage,
    alignSelf: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.sageRule,
    paddingBottom: 2,
  },
});
