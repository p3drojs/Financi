import { TextStyle } from 'react-native';

export const colors = {
  paper: '#1B1815',
  paperRaised: '#211D18',
  ink: '#EDE6D9',
  inkMuted: '#A69C8C',
  inkFaint: '#6E6659',
  inkGhost: '#4E463C',
  rule: '#443D34',
  ruleSoft: '#332D26',
  ruleFaint: '#2C2721',
  ruleHair: '#262119',
  track: '#3A342B',
  sage: '#74B396',
  sageBright: '#8FC7AC',
  sageRule: '#3A5A4A',
  brick: '#CE867E',
  brickRule: '#6B4640',
} as const;

export const fonts = {
  serif: 'Newsreader_300Light',
  serifThin: 'Newsreader_200ExtraLight',
  serifItalic: 'Newsreader_300Light_Italic',
  sans: 'Karla_400Regular',
  sansLight: 'Karla_300Light',
  sansMedium: 'Karla_500Medium',
} as const;

export const space = {
  gutter: 24,
  screenTop: 56,
  tabBar: 74,
  touch: 44,
} as const;

export const type = {
  title: { fontFamily: fonts.serifItalic, fontSize: 23, color: colors.ink },
  titleSmall: { fontFamily: fonts.serifItalic, fontSize: 22, color: colors.ink },
  note: { fontFamily: fonts.serifItalic, fontSize: 16, lineHeight: 24, color: colors.inkMuted },
  label: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  body: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  bodyMuted: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted },
  field: { fontFamily: fonts.sans, fontSize: 17, color: colors.ink },
  caption: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkGhost },
  tiny: { fontFamily: fonts.sans, fontSize: 11, color: colors.inkFaint },
} as const;

export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };
