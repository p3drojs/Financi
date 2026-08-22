import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Actions } from '@/components/Actions';
import { Screen } from '@/components/Screen';
import { InlineError } from '@/components/States';
import { TextField } from '@/components/TextField';
import { WavyRule } from '@/components/WavyRule';
import { useAuth } from '@/auth/AuthContext';
import { colors, fonts, space, type } from '@/theme/tokens';

const MIN_PASSWORD = 8;

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const registering = mode === 'register';
  const missing = MIN_PASSWORD - password.length;
  const missingLabel = missing === 1 ? 'falta 1 caractere' : `faltam ${missing} caracteres`;
  const passwordShort = registering && password.length > 0 && missing > 0;
  const passwordError = passwordShort ? missingLabel : undefined;
  const complete =
    email.trim().length > 0 &&
    password.length >= (registering ? MIN_PASSWORD : 1);

  const submit = async () => {
    setBusy(true);
    setError(null);

    try {
      if (registering) {
        await signUp({
          email: email.trim(),
          password,
          ...(name.trim() ? { name: name.trim() } : {}),
        });
      } else {
        await signIn({ email: email.trim(), password });
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(registering ? 'login' : 'register');
    setError(null);
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.brand}>
        <Text style={styles.wordmark}>financi</Text>
        <Text style={type.note}>
          {registering
            ? 'uma conta só sua, num servidor só seu.'
            : 'o mês inteiro numa tela, sem banco nenhum olhando.'}
        </Text>
      </View>

      <View style={styles.rule}>
        <WavyRule />
      </View>

      <View style={styles.fields}>
        {registering ? (
          <TextField
            label="como te chamo"
            value={name}
            onChangeText={setName}
            placeholder="seu nome"
            autoCapitalize="words"
            hint="opcional"
          />
        ) : null}

        <TextField
          label="seu email"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextField
          label="sua senha"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          hint={registering ? `no mínimo ${MIN_PASSWORD} caracteres` : undefined}
          error={passwordError}
        />
      </View>

      <View style={styles.spacer} />

      <View style={styles.errorSlot}>
        <InlineError error={error} />
      </View>

      {registering ? (
        <Text style={styles.seedNote}>
          ao criar a conta você já ganha as 13 categorias padrão — dá para renomear, trocar a cor
          ou apagar depois.
        </Text>
      ) : null}

      <Actions
        primaryLabel={registering ? 'criar a conta' : 'entrar'}
        onPrimary={submit}
        busy={busy}
        disabled={!complete}
      />

      <Pressable style={styles.toggle} onPress={switchMode} disabled={busy}>
        <Text style={styles.toggleLabel}>
          {registering ? 'já tenho conta' : 'ainda não tenho conta'}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 34 },
  brand: { marginTop: 60, gap: 12 },
  wordmark: {
    fontFamily: fonts.serifItalic,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  rule: { marginTop: 34 },
  fields: { marginTop: 34, gap: 28 },
  spacer: { flexGrow: 1, minHeight: 40 },
  errorSlot: { marginBottom: 14 },
  seedNote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.inkFaint,
    lineHeight: 18,
    marginBottom: 20,
  },
  toggle: { minHeight: space.touch, justifyContent: 'center', alignSelf: 'center', marginTop: 8 },
  toggleLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.sage,
    borderBottomWidth: 1,
    borderBottomColor: colors.sageRule,
    paddingBottom: 2,
  },
});
