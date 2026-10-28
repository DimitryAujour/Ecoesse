'use client';

import React, { useState, useEffect } from 'react';
import { auth, googleProvider, db } from '@/lib/firebase/client';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';
import { SAMPLE_PRODUCTS, INITIAL_GLOBAL_IMPACT } from '@/lib/seed/products';
import { Product, Order } from '@/types/commerce';
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

// Fulfillment editor for one order (follow-up to the read-only orders
// tab). The orders tab showed fulfillment status and tracking but gave
// the admin no way to change them, so fulfilling an order meant
// editing Firestore by hand. This editor writes fulfillmentStatus and
// trackingNumber back to the order document (admin writes are allowed
// under the M-01 rules). It does not touch payment, impact, or
// customer fields, and it never fabricates a tracking number: an
// empty tracking field saves as null. On a failed write the inputs
// revert to the order's stored values and an error is shown, so the
// card never claims a change that did not persist.
function FulfillmentEditor({
  order,
  dict,
  onSaved,
}: {
  order: Order;
  dict: any;
  onSaved: (updated: Order) => void;
}) {
  const [fulfillmentStatus, setFulfillmentStatus] = useState<string>(
    order.fulfillmentStatus ?? 'unfulfilled'
  );
  const [trackingNumber, setTrackingNumber] = useState<string>(
    order.trackingNumber ?? ''
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<boolean>(false);

  const changed =
    fulfillmentStatus !== (order.fulfillmentStatus ?? 'unfulfilled') ||
    trackingNumber !== (order.trackingNumber ?? '');

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(false);
    const next: Order = {
      ...order,
      fulfillmentStatus: fulfillmentStatus as Order['fulfillmentStatus'],
      trackingNumber: trackingNumber.trim() ? trackingNumber.trim() : null,
    };
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        fulfillmentStatus: next.fulfillmentStatus,
        trackingNumber: next.trackingNumber,
      });
      onSaved(next);
      setSaved(true);
    } catch (err) {
      console.warn('Admin fulfillment save failed:', err);
      setFulfillmentStatus(order.fulfillmentStatus ?? 'unfulfilled');
      setTrackingNumber(order.trackingNumber ?? '');
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-4 border-t border-white/10 flex flex-wrap items-end gap-3 text-xs">
      <label className="flex flex-col gap-1 text-slate-400">
        <span className="uppercase text-[10px] text-slate-500">{dict.admin.fulfillment}:</span>
        <select
          value={fulfillmentStatus}
          onChange={(e) => {
            setFulfillmentStatus(e.target.value);
            setSaved(false);
          }}
          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-semibold"
        >
          <option value="unfulfilled">{dict.admin.fulfillmentUnfulfilled}</option>
          <option value="shipped">{dict.admin.fulfillmentShipped}</option>
          <option value="delivered">{dict.admin.fulfillmentDelivered}</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-slate-400 flex-1 min-w-[180px]">
        <span className="uppercase text-[10px] text-slate-500">{dict.admin.tracking}:</span>
        <input
          value={trackingNumber}
          onChange={(e) => {
            setTrackingNumber(e.target.value);
            setSaved(false);
          }}
          placeholder={dict.admin.tracking}
          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-medium"
        />
      </label>
      <button
        onClick={handleSave}
        disabled={!changed || saving}
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold"
      >
        {saving ? '…' : dict.admin.save}
      </button>
      {saved && <span className="text-emerald-400 font-semibold">{dict.admin.saved}</span>}
      {saveError && <span className="text-rose-300 font-medium">{dict.admin.saveError}</span>}
    </div>
  );
}

export default function AdminPage() {
  const { dict, locale } = useLocale();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  // Admin-claim gate (follow-up to M-01). Firestore rules already
  // reject non-admin writes, but the old UI showed the admin controls
  // to any signed-in user, so a non-admin would only discover the
  // rejection by trying to seed. The UI now mirrors the rules: only a
  // user whose ID token carries admin: true sees the controls.
  // This is a UX gate only — the rules remain the security boundary,
  // and a claim set server-side is only picked up after a token
  // refresh, which is why getIdTokenResult is forced here.
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  // Inventory, wired to real Firestore products (follow-up to the
  // orders tab). The old table rendered SAMPLE_PRODUCTS from code and
  // the +/- stock buttons only changed local state, so stock changes
  // never persisted and the table showed the sample catalog whether
  // or not Firestore had been seeded. The table now loads the
  // products collection (admin read under the M-01 rules) once the
  // claim gate passes, and stock changes write through to Firestore.
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<boolean>(false);

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError(false);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
      list.sort((a, b) => a.id.localeCompare(b.id));
      setProducts(list);
    } catch (err) {
      console.warn('Admin products load failed:', err);
      setProductsError(true);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadProducts();
  }, [isAdmin]);

  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'settings'>('inventory');
  // Real orders for the orders tab. Loaded only once the admin-claim
  // gate has passed (isAdmin === true), because the M-01 Firestore
  // rules allow listing orders for admins only. This page is
  // admin-only by that gate, so rendering customerEmail and the
  // shipping destination here is an admin view — never public, unlike
  // the /impact/[orderId] page, which must never show those fields.
  // The Stripe webhook currently writes orders without an items field,
  // so items are rendered only when a record actually carries them.
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [ordersError, setOrdersError] = useState<boolean>(false);

  const loadOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(false);
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
      list.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
      setOrders(list.slice(0, 50));
    } catch (err) {
      console.warn('Admin orders load failed:', err);
      setOrdersError(true);
      setOrders(null);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadOrders();
  }, [isAdmin]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setIsAdmin(false);
        setAuthLoading(false);
        return;
      }
      try {
        const token = await user.getIdTokenResult(true);
        setIsAdmin((token.claims as Record<string, unknown>).admin === true);
      } catch (err) {
        console.warn('Admin claim check failed, treating as non-admin:', err);
        setIsAdmin(false);
      } finally {
        setAuthLoading(false);
      }
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
    if (!isAdmin) return;
    setIsSeeding(true);
    setSeedSuccess(null);

    try {
      for (const prod of SAMPLE_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }

      // Seed global stats
      await setDoc(doc(db, 'site_stats', 'global_impact'), INITIAL_GLOBAL_IMPACT);

      setSeedSuccess(dict.admin.seedSuccess);
      // Refresh the table from what was actually written, rather
      // than assuming the sample catalog is what Firestore holds.
      await loadProducts();
    } catch (err: any) {
      console.warn('Firestore seeding info (permission or offline):', err.message);
      setSeedSuccess(dict.admin.seedDemo);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleUpdateStock = async (productId: string, delta: number) => {
    if (!isAdmin) return;
    const current = products.find((p) => p.id === productId);
    if (!current) return;
    const newCount = Math.max(0, current.inventoryCount + delta);
    // Optimistic update, reverted if the Firestore write fails, so
    // the table never claims a stock change that did not persist.
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, inventoryCount: newCount } : p))
    );
    try {
      await updateDoc(doc(db, 'products', productId), {
        inventoryCount: newCount,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Admin stock update failed, reverting:', err);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, inventoryCount: current.inventoryCount } : p
        )
      );
    }
  };

  // Product status control. Until now the status column was a
  // display-only badge, so there was no way in /admin to hide a
  // product from the storefront: the PR #12 catalog loader only
  // shows active products, but nothing in the UI could set a product
  // to draft or archived. This select writes the status through to
  // Firestore with the same optimistic-update-and-revert pattern as
  // stock, so changing a product to draft/archived immediately
  // removes it from the homepage catalog and detail pages, and
  // changing it back to active restores it.
  const handleUpdateStatus = async (
    productId: string,
    newStatus: 'active' | 'draft' | 'archived'
  ) => {
    if (!isAdmin) return;
    const current = products.find((p) => p.id === productId);
    if (!current || current.status === newStatus) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
    );
    try {
      await updateDoc(doc(db, 'products', productId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Admin status update failed, reverting:', err);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, status: current.status } : p
        )
      );
    }
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

      {/* Admin-claim gate: signed-in non-admins see this notice, not
          the controls below. Signed-out visitors see only the sign-in
          button in the header. While the claim is being checked,
          nothing below the header is rendered, so controls never flash
          for a non-admin. */}
      {currentUser && !authLoading && isAdmin === false && (
        <div className="p-6 rounded-2xl eco-glass border border-amber-500/30 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" /> {dict.admin.notAdminTitle}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">{dict.admin.notAdminText}</p>
          <p className="text-xs text-slate-500">
            {currentUser.email}
          </p>
        </div>
      )}
      {currentUser && !authLoading && isAdmin === null && (
        <p className="text-xs text-slate-400">{dict.admin.checking}</p>
      )}

      {isAdmin && (
        <>
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

          {productsLoading && (
            <p className="text-xs text-slate-400">{dict.admin.productsLoading}</p>
          )}

          {productsError && (
            <div className="p-6 rounded-2xl eco-glass border border-rose-500/30 space-y-3">
              <p className="text-xs text-rose-300 leading-relaxed">{dict.admin.productsLoadError}</p>
              <button
                onClick={loadProducts}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10"
              >
                {dict.admin.retry}
              </button>
            </div>
          )}

          {!productsLoading && !productsError && products.length === 0 && (
            <p className="text-xs text-slate-400">{dict.admin.productsEmpty}</p>
          )}

          {products.length > 0 && (
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
                      <select
                        value={p.status}
                        onChange={(e) =>
                          handleUpdateStatus(
                            p.id,
                            e.target.value as 'active' | 'draft' | 'archived'
                          )
                        }
                        className="px-2 py-1.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold uppercase text-[10px]"
                      >
                        <option value="active">{dict.admin.statusActive}</option>
                        <option value="draft">{dict.admin.statusDraft}</option>
                        <option value="archived">{dict.admin.statusArchived}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS & FULFILLMENT — real Firestore orders, newest
          first, up to 50. The old tab was a single hardcoded sample
          order (fake email, fake $54.48 total, fake Montreal address,
          and a demo certificate link); it is removed entirely. */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">{dict.admin.ordersTitle}</h2>
            <p className="text-xs text-slate-400">
              {dict.admin.ordersText}
            </p>
          </div>

          {ordersLoading && (
            <p className="text-xs text-slate-400">{dict.admin.loading}</p>
          )}

          {ordersError && (
            <div className="p-6 rounded-2xl eco-glass border border-rose-500/30 space-y-3">
              <p className="text-xs text-rose-300 leading-relaxed">{dict.admin.loadError}</p>
              <button
                onClick={loadOrders}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10"
              >
                {dict.admin.retry}
              </button>
            </div>
          )}

          {!ordersLoading && !ordersError && orders && orders.length === 0 && (
            <p className="text-xs text-slate-400">{dict.admin.empty}</p>
          )}

          {!ordersLoading && !ordersError && orders && orders.map((order) => {
            const paymentLabel =
              {
                paid: dict.admin.paymentPaid,
                pending: dict.admin.paymentPending,
                failed: dict.admin.paymentFailed,
                refunded: dict.admin.paymentRefunded,
              }[order.paymentStatus as string] ?? order.paymentStatus;
            const fulfillmentLabel =
              {
                unfulfilled: dict.admin.fulfillmentUnfulfilled,
                shipped: dict.admin.fulfillmentShipped,
                delivered: dict.admin.fulfillmentDelivered,
              }[order.fulfillmentStatus as string] ?? order.fulfillmentStatus;
            const impact = order.impactRecord;
            const isVerified = impact?.greensparkStatus === 'verified' && !!impact?.greensparkTransactionId;
            const dateLocale = locale === 'fr' ? 'fr-CA' : 'en-CA';
            const orderDate = order.createdAt
              ? new Date(
                  typeof order.createdAt === 'string'
                    ? order.createdAt
                    : typeof order.createdAt?.toDate === 'function'
                      ? order.createdAt.toDate()
                      : order.createdAt.seconds
                        ? order.createdAt.seconds * 1000
                        : order.createdAt,
                ).toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' })
              : null;
            const address = order.shippingAddress;
            const addressLine = address
              ? [address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ')
              : '';
            return (
              <div key={order.id} className="p-6 rounded-2xl eco-glass border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <span className="text-xs font-bold text-white">
                      #{order.id.length > 8 ? `…${order.id.slice(-8).toUpperCase()}` : order.id}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {dict.admin.customer}: {order.customerEmail}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold uppercase">
                    {paymentLabel} ({((order.totalAmountCents ?? 0) / 100).toFixed(2)} CAD)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase text-[10px]">{dict.admin.date}:</span>
                    <p className="text-slate-300 font-medium">{orderDate ?? '—'}</p>
                    {addressLine && (
                      <>
                        <span className="text-slate-500 uppercase text-[10px]">{dict.admin.destination}:</span>
                        <p className="text-slate-300 font-medium">{addressLine}</p>
                      </>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[10px]">{dict.admin.fulfillment}:</span>
                    <p className="text-amber-400 font-bold flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> {fulfillmentLabel}
                    </p>
                    {order.trackingNumber && (
                      <p className="text-slate-400 mt-1">{order.trackingNumber}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[10px]">{dict.admin.impactLedger}:</span>
                    <p className="text-slate-300 font-medium">
                      {isVerified
                        ? `${dict.admin.verified} — +${impact!.treesPlanted} ${dict.impact.trees}, +${impact!.plasticSaved} ${dict.impact.bottles}, +${impact!.carbonOffset} kg`
                        : dict.admin.pendingImpact}
                    </p>
                    <Link
                      href={`/impact/${order.id}`}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 mt-1"
                    >
                      {dict.admin.viewCertificate} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {Array.isArray(order.items) && order.items.length > 0 && (
                  <ul className="text-xs text-slate-400 space-y-1 pt-2 border-t border-white/10">
                    {order.items.map((item, i) => (
                      <li key={i}>
                        {item.title} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                )}

                <FulfillmentEditor
                  order={order}
                  dict={dict}
                  onSaved={(updated) =>
                    setOrders((prev) =>
                      prev ? prev.map((o) => (o.id === updated.id ? updated : o)) : prev
                    )
                  }
                />
              </div>
            );
          })}
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
      </>
      )}
    </div>
  );
}
