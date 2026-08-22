import { StyleProp, Text, TextStyle } from 'react-native';
import { fonts, tabular } from '@/theme/tokens';

interface MoneyProps {
  children: string;
  style?: StyleProp<TextStyle>;
}

export function Money({ children, style }: MoneyProps) {
  return <Text style={[{ fontFamily: fonts.sans }, tabular, style]}>{children}</Text>;
}
