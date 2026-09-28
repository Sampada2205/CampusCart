"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

type OrderRow = {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  createdAt: string;
  product: {
    id: string;
    title: string;
    image: string;
    category: string;
    condition: string;
  } | null;
  seller: {
    id: string;
    name: string;
    college: string;
  } | null;
};

function OrdersInner() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const justPaid = searchParams.get("status") === "success";

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Not signed in");
        const res = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load orders");
        }
        const data = await res.json();
        setOrders(data.orders ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();

    // Poll once more after a short delay — the webhook may take a second
    const t = setTimeout(load, 3000);
    return () => clearTimeout(t);
  }, [user, authLoading, justPaid]);

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold text-slate-900">Your Orders</h1>
      <p className="mt-2 text-sm text-slate-500">
        Items you have purchased on CampusCart.
      </p>

      {justPaid && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Payment received. Your order will appear below once Stripe confirms
          it.
        </div>
      )}

      <div className="mt-8">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <p className="text-slate-500">You have no orders yet.</p>
            <div className="mt-4">
              <Button href="/marketplace" size="sm">
                Browse Marketplace
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center gap-4 p-4">
                {o.product?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.product.image}
                    alt={o.product.title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-slate-100" />
                )}

                <div className="min-w-0 flex-1">
                  <Link
                    href={o.product ? `/product/${o.product.id}` : "#"}
                    className="block truncate text-sm font-semibold text-slate-900 hover:underline"
                  >
                    {o.product?.title ?? "Product removed"}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    Sold by {o.seller?.name ?? "Unknown"} ·{" "}
                    {o.seller?.college ?? ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm font-bold text-slate-900">
                    ₹{o.amount.toLocaleString("en-IN")}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      o.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : o.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
        <OrdersInner />
      </Suspense>
    </ProtectedRoute>
  );
}