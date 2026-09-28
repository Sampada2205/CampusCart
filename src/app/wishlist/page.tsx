"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Container from "@/components/Container";
import Button from "@/components/Button";
import ProductCard, { ProductCardData } from "@/components/ProductCard";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

function WishlistInner() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Not signed in");

        const res = await fetch("/api/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load wishlist");
        }

        const data = await res.json();
        setProducts(data.products ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading]);

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold text-slate-900">Your Wishlist</h1>
      <p className="mt-2 text-sm text-slate-500">
        Items you have saved for later.
      </p>

      <div className="mt-8">
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <p className="text-slate-500">Your wishlist is empty.</p>
            <div className="mt-4">
              <Button href="/marketplace" size="sm">
                Browse Marketplace
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}

export default function WishlistPage() {
  return (
    <ProtectedRoute>
      <WishlistInner />
    </ProtectedRoute>
  );
}