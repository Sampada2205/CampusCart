"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { updateListing } from "@/lib/dashboardClient";
import { auth } from "@/lib/firebase";

const CATEGORIES = ["Books", "Notes", "Electronics", "Gadgets", "Stationery", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Used"];

type ProductData = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  college: string;
  location: string;
  images: string[];
  status: string;
};

function EditInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [college, setCollege] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${params.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        const p: ProductData = data.product;
        setProduct(p);
        setTitle(p.title);
        setDescription(p.description);
        setPrice(String(p.price));
        setCategory(p.category);
        setCondition(p.condition);
        setCollege(p.college);
        setLocation(p.location);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const priceNumber = Number(price);
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      setError("Please enter a valid price.");
      return;
    }

    setSaving(true);
    try {
      // Ownership check just in case — the server enforces it too
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in");

      await updateListing(params.id, {
        title,
        description,
        price: priceNumber,
        category,
        condition,
        college,
        location,
      });

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container className="py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 text-sm text-slate-500 hover:text-slate-800"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold text-slate-900">Edit listing</h1>

      {loading && <p className="mt-6 text-slate-500">Loading...</p>}

      {!loading && error && !product && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      )}

      {!loading && product && (
        <form onSubmit={handleSave} className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6">
            <div>
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div>
                <label className="text-sm font-medium text-slate-700">Price (₹)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min={0}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-slate-700">College</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-slate-700">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button type="submit" disabled={saving} size="lg" className="w-full">
              {saving ? "Saving..." : "Save changes"}
            </Button>
            <Button href="/dashboard" variant="ghost" className="w-full">
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Container>
  );
}

export default function EditListingPage() {
  return (
    <ProtectedRoute>
      <EditInner />
    </ProtectedRoute>
  );
}