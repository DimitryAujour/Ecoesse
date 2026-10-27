'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout, Trees, Waves, ShieldCheck } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

export const Footer: React.FC = () => {
  const { dict } = useLocale();
  return (
    <footer className="mt-24 border-t border-emerald-950/80 bg-[#080e0b] text-slate-400 text-xs">
      {/* Environmental Trust Banner */}
      <div className="border-b border-white/5 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">{dict.footer.treeTitle}</h4>
              <p className="text-[11px] text-slate-500">{dict.footer.treeText}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">{dict.footer.oceanTitle}</h4>
              <p className="text-[11px] text-slate-500">{dict.footer.oceanText}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">{dict.footer.canadianTitle}</h4>
              <p className="text-[11px] text-slate-500">{dict.footer.canadianText}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Copyright */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <Sprout className="w-4 h-4" />
          </div>
          <span className="font-bold text-white text-sm">{dict.footer.engineName}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500 text-[11px]">{dict.footer.engineTech}</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/admin" className="hover:text-emerald-400 transition-colors">
            {dict.footer.adminDashboard}
          </Link>
          {/* No generic impact-certificate link here either, for the
              same reason as the header: certificates are per-order,
              and the old demo link now correctly shows not-found. */}
          <span className="text-slate-600">© {new Date().getFullYear()} Ecoesse Inc.</span>
        </div>
      </div>
    </footer>
  );
};
