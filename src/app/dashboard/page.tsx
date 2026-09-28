"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchMyListings,
  fetchMySales,
  deleteListing,
  markSold,
  MyListing,
  SaleRow,
} from "@/lib/dashboardClient";

type Tab = "listings" | "sales";

function DashboardInner() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("listings");

  const [listings, setListings] = useState<MyListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState("");

  const [sales, setSales] = useState<SaleRow[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState("");

  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadListings() {
    setListingsLoading(true);
    setListingsError("");
    try {
      const data = await fetchMyListings();
      setListings(data);
    } catch (err) {
      setListingsError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setListingsLoading(false);
    }
  }

  async function loadSales() {
    setSalesLoading(true);
    setSalesError("");
    try {
      const data = await fetchMySales();
      setSales(data);
    } catch (err) {
      setSalesError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSalesLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading || !user) return;
    loadListings();
    loadSales();
  }, [authLoading, user]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkSold(id: string) {
    setBusyId(id);
    try {
      await markSold(id);
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "sold" } : l))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark sold");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your listings and see your sales.
          </p>
        </div>
        <Button href="/sell">List a new item</Button>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-slate-200">
        {(["listings", "sales"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "text-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t === "listings" ? "My Listings" : "Sales"}
            {tab === t && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* Listings tab */}
      {tab === "listings" && (
        <div className="mt-8">
          {listingsLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          )}

          {!listingsLoading && listingsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
              {listingsError}
            </div>
          )}

          {!listingsLoading && !listingsError && listings.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
              <p className="text-slate-500">You haven't listed anything yet.</p>
              <div className="mt-4">
                <Button href="/sell" size="sm">
                  Sell your first item
                </Button>
              </div>
            </div>
          )}

          {!listingsLoading && !listingsError && listings.length > 0 && (
            <ul className="space-y-3">
              {listings.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
                >
                  {l.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.images[0]}
                      alt={l.title}
                      className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-slate-100" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/product/${l.id}`}
                        className="truncate text-sm font-semibold text-slate-900 hover:underline"
                      >
                        {l.title}
                      </Link>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          l.status === "sold"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      ₹{l.price.toLocaleString("en-IN")} · {l.category} · {l.condition}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Listed {new Date(l.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      href={`/dashboard/listings/${l.id}/edit`}
                      variant="secondary"
                      size="sm"
                    >
                      Edit
                    </Button>
                    {l.status === "available" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkSold(l.id)}
                        disabled={busyId === l.id}
                      >
                        {busyId === l.id ? "..." : "Mark sold"}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(l.id)}
                      disabled={busyId === l.id}
                    >
                      {busyId === l.id ? "..." : "Delete"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sales tab */}
      {tab === "sales" && (
        <div className="mt-8">
          {salesLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          )}

          {!salesLoading && salesError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
              {salesError}
            </div>
          )}

          {!salesLoading && !salesError && sales.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
              <p className="text-slate-500">No sales yet.</p>
            </div>
          )}

          {!salesLoading && !salesError && sales.length > 0 && (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {sales.map((s) => (
                <li key={s.id} className="flex items-center gap-4 p-4">
                  {s.product?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.product.image}
                      alt={s.product.title}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-slate-100" />
                  )}

                  <div className="min-w-0 flex-1">
                    <Link
                      href={s.product ? `/product/${s.product.id}` : "#"}
                      className="truncate text-sm font-semibold text-slate-900 hover:underline"
                    >
                      {s.product?.title ?? "Product removed"}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      Buyer: {s.buyer?.name ?? "Unknown"} · {s.buyer?.college ?? ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(s.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <p className="text-sm font-bold text-slate-900">
                      ₹{s.amount.toLocaleString("en-IN")}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : s.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Container>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardInner />
    </ProtectedRoute>
  );
}