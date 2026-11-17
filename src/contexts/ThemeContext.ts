// Preserve the existing import path while keeping the provider's refresh boundary
// separate from context, palette and hook exports.
export { ThemeProvider } from './ThemeProvider';
export { darkTheme, lightTheme, ThemeContext, useTheme } from './theme';
export type { ThemeColors, ThemeMode } from './theme';
