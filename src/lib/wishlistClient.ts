"use client";

import { auth } from "@/lib/firebase";

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function checkInWishlist(productId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    const token = await user.getIdToken();
    const res = await fetch(`/api/wishlist/check/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.inWishlist);
  } catch {
    return false;
  }
}

export async function addToWishlist(productId: string): Promise<void> {
  const headers = { ...(await authHeader()), "Content-Type": "application/json" };
  const res = await fetch("/api/wishlist", {
    method: "POST",
    headers,
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to add to wishlist");
  }
}

export async function removeFromWishlist(productId: string): Promise<void> {
  const headers = { ...(await authHeader()), "Content-Type": "application/json" };
  const res = await fetch("/api/wishlist", {
    method: "DELETE",
    headers,
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to remove from wishlist");
  }
}