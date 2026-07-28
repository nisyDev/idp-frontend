import React, { createContext, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Background colors
  background: string;
  backgroundSecondary: string;
  
  // Sidebar colors
  sidebarBackground: string;
  sidebarText: string;
  sidebarItemHover: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Card/Container colors
  cardBackground: string;
  cardBorder: string;
  
  // Accent colors
  accent: string;
  accentLight: string;
  
  // Status/Interactive colors
  success: string;
  warning: string;
  error: string;
  
  // Gradients
  gradientBannerStart: string;
  gradientBannerEnd: string;
  
  // Button colors
  buttonBackground: string;
  buttonText: string;
  buttonHover: string;
  
  // Input/Edit colors
  inputBackground: string;
  inputBorder: string;
}

export const lightTheme: ThemeColors = {
  background: '#FFFBF0',
  backgroundSecondary: '#F5F3ED',
  
  sidebarBackground: '#E0F2FE',
  sidebarText: '#1F2937',
  sidebarItemHover: '#BAE6FD',
  
  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  
  cardBackground: '#FFFFFF',
  cardBorder: '#E5E7EB',
  
  accent: '#2563EB',
  accentLight: '#93C5FD',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  gradientBannerStart: '#60A5FA',
  gradientBannerEnd: '#F5D547',
  
  buttonBackground: '#F3F4F6',
  buttonText: '#1F2937',
  buttonHover: '#E5E7EB',
  
  inputBackground: '#F9FAFB',
  inputBorder: '#D1D5DB',
};

export const darkTheme: ThemeColors = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  
  sidebarBackground: '#1E293B',
  sidebarText: '#F1F5F9',
  sidebarItemHover: '#334155',
  
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  
  cardBackground: '#1E293B',
  cardBorder: '#334155',
  
  accent: '#60A5FA',
  accentLight: '#93C5FD',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  gradientBannerStart: '#60A5FA',
  gradientBannerEnd: '#F5D547',
  
  buttonBackground: '#334155',
  buttonText: '#F1F5F9',
  buttonHover: '#475569',
  
  inputBackground: '#0F172A',
  inputBorder: '#334155',
};

interface ThemeContextType {
  mode: ThemeMode;
  theme: ThemeColors;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  
  const theme = mode === 'light' ? lightTheme : darkTheme;
  
  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
