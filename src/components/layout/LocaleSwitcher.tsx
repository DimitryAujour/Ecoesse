'use client';

import React from 'react';
import { useLocale } from '@/context/LocaleContext';
import type { Locale } from '@/lib/i18n/dictionary';

export const LocaleSwitcher: React.FC = () => {
  const { locale, dict, setLocale } = useLocale();

  const button = (value: Locale, label: string) => (
    <button
      key={value}
      onClick={() => setLocale(value)}
      aria-label={`${dict.localeSwitcher.label}: ${label}`}
      aria-pressed={locale === value}
      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
        locale === value
          ? 'bg-emerald-600 text-white'
          : 'text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 p-0.5">
      {button('en', dict.localeSwitcher.english)}
      {button('fr', dict.localeSwitcher.french)}
    </div>
  );
};
