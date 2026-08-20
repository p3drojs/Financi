import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { WavyRule } from '@/components/WavyRule';
import { ChevronRight } from '@/components/icons';
import { authUser, categories, tags } from '@/mock/data';
import { colors, fonts, space, type } from '@/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text style={type.title}>você</Text>

      <View style={styles.identity}>
        <Text style={styles.name}>{authUser.name ?? authUser.email}</Text>
        {authUser.name ? <Text style={styles.email}>{authUser.email}</Text> : null}
      </View>

      <View style={styles.rule}>
        <WavyRule />
      </View>

      <View style={styles.links}>
        <NavLink
          href="/categorias"
          label="categorias"
          detail={`${categories.length} — ${categories.filter((c) => c.type === 'INCOME').length} de entrada, ${categories.filter((c) => c.type === 'EXPENSE').length} de saída`}
        />
        <NavLink href="/etiquetas" label="etiquetas" detail={`${tags.length} escritas até agora`} />
      </View>

      <View style={styles.spacer} />

      <Text style={styles.note}>
        seus lançamentos ficam no seu servidor. nada aqui conversa com banco ou cartão.
      </Text>

      <Pressable style={styles.signOut} onPress={() => router.replace('/entrar')}>
        <Text style={styles.signOutLabel}>sair desta conta</Text>
      </Pressable>
    </Screen>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  detail: string;
}

function NavLink({ href, label, detail }: NavLinkProps) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.link}>
        <View style={styles.linkBody}>
          <Text style={styles.linkLabel}>{label}</Text>
          <Text style={type.caption}>{detail}</Text>
        </View>
        <ChevronRight color={colors.inkFaint} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 24 },
  identity: { marginTop: 30, gap: 6 },
  name: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, color: colors.ink },
  email: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted },
  rule: { marginTop: 28 },
  links: { marginTop: 10 },
  link: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleHair,
  },
  linkBody: { gap: 4, flexShrink: 1 },
  linkLabel: { fontFamily: fonts.sans, fontSize: 17, color: colors.ink },
  spacer: { flexGrow: 1, minHeight: 30 },
  note: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 23,
    color: colors.inkFaint,
    marginBottom: 8,
  },
  signOut: { minHeight: space.touch, justifyContent: 'center', alignSelf: 'flex-start' },
  signOutLabel: { fontFamily: fonts.sans, fontSize: 15, color: colors.brick },
});
