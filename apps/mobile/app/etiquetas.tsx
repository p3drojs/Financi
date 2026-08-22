import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDeleteTag, useTags } from '@/api/queries';
import { Tag } from '@/api/types';
import { BackHeader } from '@/components/BackHeader';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Loading, messageOf } from '@/components/States';
import { colors, fonts, type } from '@/theme/tokens';

export default function TagsScreen() {
  const query = useTags();
  const remove = useDeleteTag();
  const [refused, setRefused] = useState<Record<string, string>>({});

  const tags = query.data ?? [];

  const drop = (tag: Tag) => {
    remove.mutate(tag.id, {
      onError: (error) => setRefused((current) => ({ ...current, [tag.id]: messageOf(error) })),
      onSuccess: () =>
        setRefused((current) => {
          const next = { ...current };
          delete next[tag.id];
          return next;
        }),
    });
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <BackHeader title="etiquetas" />

      <Text style={styles.note}>
        etiqueta não se cria aqui — ela nasce quando você escreve uma num lançamento. esta tela é
        só para varrer as que sobraram.
      </Text>

      {query.error ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Loading label="juntando as etiquetas" />
      ) : tags.length === 0 ? (
        <EmptyState text="nenhuma etiqueta escrita ainda" />
      ) : (
        <>
          <View style={styles.list}>
            {tags.map((item) => (
              <TagRow
                key={item.id}
                item={item}
                refusal={refused[item.id]}
                busy={remove.isPending && remove.variables === item.id}
                onDelete={() => drop(item)}
              />
            ))}
          </View>

          <Text style={styles.footer}>{tags.length} no total</Text>
        </>
      )}
    </Screen>
  );
}

interface TagRowProps {
  item: Tag;
  refusal: string | undefined;
  busy: boolean;
  onDelete: () => void;
}

function TagRow({ item, refusal, busy, onDelete }: TagRowProps) {
  return (
    <View style={styles.rowWrapper}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        {refusal ? (
          <Text style={type.caption}>em uso</Text>
        ) : (
          <Pressable style={styles.delete} onPress={onDelete} disabled={busy}>
            <Text style={styles.deleteLabel}>{busy ? 'apagando' : 'apagar'}</Text>
          </Pressable>
        )}
      </View>
      {refusal ? <Text style={styles.refusal}>{refusal}</Text> : null}
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
  rowWrapper: { borderBottomWidth: 1, borderBottomColor: colors.ruleHair, paddingBottom: 4 },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  name: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink, flexShrink: 1 },
  delete: { paddingVertical: 12, paddingLeft: 12 },
  deleteLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.brick },
  refusal: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkFaint,
    paddingBottom: 8,
  },
  footer: { marginTop: 20, fontFamily: fonts.sans, fontSize: 12, color: colors.inkGhost },
});
