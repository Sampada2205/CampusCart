"use client";

import { auth } from "@/lib/firebase";

export type Profile = {
  id: string;
  name: string;
  email: string;
  college: string;
  profileImage: string;
  createdAt: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchProfile(): Promise<Profile> {
  const headers = await authHeaders();
  const res = await fetch("/api/users/me", { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load profile");
  }
  const data = await res.json();
  return data.user as Profile;
}

export async function updateProfile(input: {
  name?: string;
  college?: string;
  profileImage?: string;
}): Promise<Profile> {
  const headers = await authHeaders();
  const res = await fetch("/api/users/me", {
    method: "PATCH",
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to update profile");
  }
  const data = await res.json();
  return data.user as Profile;
}