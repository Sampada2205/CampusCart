"use client";

import { auth } from "@/lib/firebase";

export type SyncedUser = {
  id: string;
  name: string;
  email: string;
  college: string;
  profileImage: string;
  createdAt: string;
};

export async function syncUserWithBackend(input?: {
  name?: string;
  college?: string;
}): Promise<SyncedUser> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Not signed in");
  }

  const token = await currentUser.getIdToken();

  const res = await fetch("/api/users/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input ?? {}),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to sync user");
  }

  const data = await res.json();
  return data.user as SyncedUser;
}