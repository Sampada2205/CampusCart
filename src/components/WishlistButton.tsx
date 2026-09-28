"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  addToWishlist,
  removeFromWishlist,
  checkInWishlist,
} from "@/lib/wishlistClient";

export default function WishlistButton({ productId }: { productId: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }
      const value = await checkInWishlist(productId);
      if (!cancelled) {
        setInWishlist(value);
        setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, productId]);

  async function toggle() {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(productId);
        setInWishlist(false);
      } else {
        await addToWishlist(productId);
        setInWishlist(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const label = loading
    ? "Loading..."
    : inWishlist
      ? "♥ Saved"
      : "♡ Save";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || loading}
      className={`inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-semibold transition ${
        inWishlist
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      } disabled:opacity-60`}
    >
      {label}
    </button>
  );
}