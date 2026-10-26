'use client';

import React, { useState, useEffect } from 'react';
import { auth, googleProvider, db } from '@/lib/firebase/client';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';
import { SAMPLE_PRODUCTS, INITIAL_GLOBAL_IMPACT } from '@/lib/seed/products';
import { Product } from '@/types/commerce';
import {
  ShieldCheck,
  Lock,
  LogOut,
  LogIn,
  Package,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Truck,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';
import { localizedTitle } from '@/lib/i18n/product';

export default function AdminPage() {
  const { dict, locale } = useLocale();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'settings'>('inventory');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Admin login error:', err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // 1-Click Seeder to Firestore
  const handleSeedProducts = async () => {
    setIsSeeding(true);
    setSeedSuccess(null);

    try {
      for (const prod of SAMPLE_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }

      // Seed global stats
      await setDoc(doc(db, 'site_stats', 'global_impact'), INITIAL_GLOBAL_IMPACT);

      setSeedSuccess(dict.admin.seedSuccess);
    } catch (err: any) {
      console.warn('Firestore seeding info (permission or offline):', err.message);
      setSeedSuccess(dict.admin.seedDemo);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleUpdateStock = (productId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, inventoryCount: Math.max(0, p.inventoryCount + delta) } : p
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{dict.admin.title}</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {dict.admin.subtitle}
          </p>
        </div>

        {/* User Auth State */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white">{currentUser.displayName || dict.admin.adminUser}</div>
                <div className="text-[10px] text-emerald-400">{currentUser.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> {dict.admin.signOut}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="px-4 py-2 rounded-xl bg-white text-black hover:bg-slate-100 font-bold text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <LogIn className="w-3.5 h-3.5" /> {dict.admin.signIn}
            </button>
          )}
        </div>
      </div>

      {seedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{seedSuccess}</span>
          </div>
          <button onClick={() => setSeedSuccess(null)} className="text-emerald-400 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'inventory' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-300 hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5 inline mr-1.5" /> {dict.admin.tabInventory} ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'orders' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-300 hover:text-white'
          }`}
        >
          <Truck className="w-3.5 h-3.5 inline mr-1.5" /> {dict.admin.tabOrders}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'settings' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-300 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5 inline mr-1.5" /> {dict.admin.tabSettings}
        </button>
      </div>

      {/* TAB 1: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">{dict.admin.catalogTitle}</h2>
              <p className="text-xs text-slate-400">
                {dict.admin.catalogText}
              </p>
            </div>

            <button
              onClick={handleSeedProducts}
              disabled={isSeeding}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-50 transition-all"
            >
              {isSeeding ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {dict.admin.seeding}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> {dict.admin.seed}
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0e1713]">
            <table className="w-full text-left text-xs text-slate-300 divide-y divide-white/5">
              <thead className="bg-black/40 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{dict.admin.tableProduct}</th>
                  <th className="py-3 px-4">{dict.admin.tableSku}</th>
                  <th className="py-3 px-4">{dict.admin.tablePrice}</th>
                  <th className="py-3 px-4">{dict.admin.tableImpact}</th>
                  <th className="py-3 px-4">{dict.admin.tableInventory}</th>
                  <th className="py-3 px-4">{dict.admin.tableStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <Link href={`/products/${p.slug}`} className="hover:text-emerald-400">
                        {localizedTitle(p, locale)}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{p.sku}</td>
                    <td className="py-3.5 px-4 font-bold text-white">${(p.price / 100).toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-400 font-medium">
                        +{p.sustainabilityMetrics.treesPlanted} {dict.product.tree}, +{p.sustainabilityMetrics.plasticBottlesSaved} {dict.product.bottles}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStock(p.id, -5)}
                          className="w-6 h-6 rounded bg-black/40 border border-white/10 text-center font-bold hover:bg-white/10"
                        >
                          -
                        </button>
                        <span className="font-bold text-white w-8 text-center">{p.inventoryCount}</span>
                        <button
                          onClick={() => handleUpdateStock(p.id, 5)}
                          className="w-6 h-6 rounded bg-black/40 border border-white/10 text-center font-bold hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold uppercase text-[10px]">
                        {p.status === 'active' ? dict.admin.statusActive : p.status === 'draft' ? dict.admin.statusDraft : dict.admin.statusArchived}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS & FULFILLMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">{dict.admin.ordersTitle}</h2>
            <p className="text-xs text-slate-400">
              {dict.admin.ordersText}
            </p>
          </div>

          <div className="p-6 rounded-2xl eco-glass border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-xs font-bold text-white">{dict.admin.sampleOrder} #ORD-9824-CA</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">{dict.admin.customer}: customer@ecoesse.ca</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold uppercase">
                {dict.admin.paid} ($54.48 CAD)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase text-[10px]">{dict.admin.destination}:</span>
                <p className="text-slate-300 font-medium">Montreal, Quebec, H2X 1Y4, Canada</p>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px]">{dict.admin.fulfillment}:</span>
                <p className="text-amber-400 font-bold flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> {dict.admin.fulfillmentProcessing}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px]">{dict.admin.impactLedger}:</span>
                <Link
                  href="/impact/demo_order_123"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  {dict.admin.viewCertificate} <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INFRASTRUCTURE & SETTINGS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl eco-glass border border-white/10 space-y-3">
            <h3 className="text-base font-bold text-white">{dict.admin.firebaseTitle}</h3>
            <p className="text-xs text-slate-400">
              {dict.admin.firebaseText} <code className="text-emerald-400">hadiyahstepsai-67349762-3e445</code>
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 font-mono pt-2">
              <div>Auth Domain: hadiyahstepsai-67349762-3e445.firebaseapp.com</div>
              <div>Database: hadiyahstepsai-67349762-3e445-default-rtdb</div>
              <div>Storage: hadiyahstepsai-67349762-3e445.firebasestorage.app</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl eco-glass border border-white/10 space-y-3">
            <h3 className="text-base font-bold text-white">{dict.admin.paymentTitle}</h3>
            <p className="text-xs text-slate-400">
              {dict.admin.paymentText}
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 font-mono pt-2">
              <div>Default Currency: CAD</div>
              <div>Automatic Tax: Enabled (CA, US)</div>
              <div>Greenspark Webhook: Triggered on checkout.session.completed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
