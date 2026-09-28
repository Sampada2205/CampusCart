"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfile, Profile } from "@/lib/profileClient";

function ProfileInner() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
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
        const data = await fetchProfile();
        setProfile(data);
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
      <h1 className="text-3xl font-bold text-slate-900">Your Profile</h1>

      {loading && (
        <div className="mt-8 h-48 animate-pulse rounded-xl bg-slate-100" />
      )}

      {!loading && error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      )}

      {!loading && profile && (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Header */}
          <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-400" />

          <div className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
              {/* Avatar */}
              <div className="-mt-16 flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-blue-600 text-3xl font-bold text-white shadow-sm">
                {profile.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profileImage}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile.name?.[0]?.toUpperCase() ?? "?"
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900">
                  {profile.name}
                </h2>
                <p className="text-sm text-slate-500">{profile.email}</p>
              </div>

              <Button href="/profile/edit" variant="secondary">
                Edit profile
              </Button>
            </div>

            {/* Details */}
            <dl className="mt-8 grid grid-cols-1 gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  College
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {profile.college}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Member since
                </dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {new Date(profile.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>

            {/* Quick links */}
            <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
              <Link
                href="/dashboard"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                My Listings
              </Link>
              <Link
                href="/orders"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                My Orders
              </Link>
              <Link
                href="/wishlist"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                My Wishlist
              </Link>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileInner />
    </ProtectedRoute>
  );
}