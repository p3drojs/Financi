import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tag } from '@/api/types';
import { BackHeader } from '@/components/BackHeader';
import { Screen } from '@/components/Screen';
import { tags, tagsInUse } from '@/mock/data';
import { colors, fonts, type } from '@/theme/tokens';

export default function TagsScreen() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="etiquetas" />

      <Text style={styles.note}>
        etiqueta não se cria aqui — ela nasce quando você escreve uma num lançamento. esta tela é
        só para varrer as que sobraram.
      </Text>

      <View style={styles.list}>
        {tags.map((item) => (
          <TagRow key={item.id} item={item} used={tagsInUse.has(item.id)} />
        ))}
      </View>

      <Text style={styles.footer}>
        {tags.length} no total · {tags.filter((item) => tagsInUse.has(item.id)).length} em uso
      </Text>
    </Screen>
  );
}

function TagRow({ item, used }: { item: Tag; used: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{item.name}</Text>
      {used ? (
        <Text style={type.caption}>em uso</Text>
      ) : (
        <Pressable style={styles.delete}>
          <Text style={styles.deleteLabel}>apagar</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  note: {
    marginTop: 20,
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 23,
    color: colors.inkMuted,
  },
  list: { marginTop: 24 },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleHair,
  },
  name: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink, flexShrink: 1 },
  delete: { paddingVertical: 12, paddingLeft: 12 },
  deleteLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.brick },
  footer: { marginTop: 20, fontFamily: fonts.sans, fontSize: 12, color: colors.inkGhost },
});
