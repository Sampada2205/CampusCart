"use client";

import { auth } from "@/lib/firebase";

async function authHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export type MyListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  college: string;
  location: string;
  status: "available" | "sold";
  createdAt: string;
};

export type SaleRow = {
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
  buyer: {
    id: string;
    name: string;
    college: string;
  } | null;
};

export async function fetchMyListings(): Promise<MyListing[]> {
  const headers = await authHeaders();
  const res = await fetch("/api/products/mine", { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load listings");
  }
  const data = await res.json();
  return data.products ?? [];
}

export async function fetchMySales(): Promise<SaleRow[]> {
  const headers = await authHeaders();
  const res = await fetch("/api/orders/sales", { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load sales");
  }
  const data = await res.json();
  return data.orders ?? [];
}

export async function deleteListing(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`/api/products/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete listing");
  }
}

export async function markSold(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`/api/products/${id}/mark-sold`, {
    method: "POST",
    headers,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to mark as sold");
  }
}

export async function updateListing(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    college: string;
    location: string;
    images: string[];
  }>
): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`/api/products/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to update listing");
  }
}