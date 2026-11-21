'use client';

export interface ThemeConfig {
  accentHex: string;
  accentRgb: string;
  cardBorder: string;
  cardBg: string;
  cardShadow: string;
  textPrimary: string;
  textSecondary: string;
  closeBtnClasses: string;
  inputBg: string;
  inputBorder: string;
  pillBg: string;
  pillBorder: string;
}

export const defaultTheme: ThemeConfig = {
  accentHex: '#CB6C6C',
  accentRgb: '203, 108, 108',
  cardBorder: 'border-white/[0.12]',
  cardBg: 'bg-[#090b10]/95 backdrop-blur-3xl',
  cardShadow: '0 25px 70px rgba(0,0,0,0.95), 0 0 35px rgba(203,108,108,0.18)',
  textPrimary: 'text-white',
  textSecondary: 'text-zinc-400',
  closeBtnClasses: 'bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-400 hover:text-white',
  inputBg: 'bg-white/[0.03]',
  inputBorder: 'border-white/[0.08]',
  pillBg: 'bg-white/[0.03]',
  pillBorder: 'border-white/[0.08]'
};

export function useActiveTheme(): ThemeConfig {
  return defaultTheme;
}
