"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Container from "@/components/Container";
import Button from "@/components/Button";
import ProductGallery from "@/components/ProductGallery";
import WishlistButton from "@/components/WishlistButton";
import { useAuth } from "@/hooks/useAuth";
import { startConversation } from "@/lib/chatClient";
import { startCheckout } from "@/lib/checkoutClient";

type ProductData = {
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
  seller: {
    id: string;
    name: string;
    college: string;
    profileImage: string;
  } | null;
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
const [starting, setStarting] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [buying, setBuying] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${params.id}`, {
          cache: "no-store",
        });
        if (res.status === 404) {
          setError("Product not found.");
          return;
        }
        if (!res.ok) throw new Error("Failed to load product");
        const data = await res.json();
        setProduct(data.product);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

 async function handleContactSeller() {
  if (!user) {
    router.push("/login");
    return;
  }
  if (!product?.seller) return;

  setStarting(true);
  try {
    const conversationId = await startConversation(product.id);
    router.push(`/chat/${conversationId}`);
  } catch (err) {
    alert(err instanceof Error ? err.message : "Failed to start chat");
  } finally {
    setStarting(false);
  }
}
  async function handleBuyNow() {
  if (!user) {
    router.push("/login");
    return;
  }
  if (!product) return;

  setBuying(true);
  try {
    const url = await startCheckout(product.id);
    window.location.href = url;
  } catch (err) {
    alert(err instanceof Error ? err.message : "Checkout failed");
    setBuying(false);
  }
}

  if (loading) {
    return (
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-slate-100" />
          <div className="flex flex-col gap-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-24 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-16">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error || "Product not found."}
        </div>
        <div className="mt-6">
          <Button href="/marketplace" variant="secondary">
            Back to marketplace
          </Button>
        </div>
      </Container>
    );
  }

  const isOwner = user?.uid === product.seller?.id;
  const isSold = product.status === "sold";

  return (
    <Container className="py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 text-sm text-slate-500 hover:text-slate-800"
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} />

        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {product.category} · {product.condition}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {product.title}
            </h1>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <WishlistButton productId={product.id} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="whitespace-pre-line text-sm text-slate-700">
              {product.description}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Seller
            </h2>
            {product.seller ? (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {product.seller.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {product.seller.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {product.seller.college}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Seller information unavailable.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                College
              </p>
              <p className="mt-1 text-sm text-slate-700">{product.college}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Location
              </p>
              <p className="mt-1 text-sm text-slate-700">{product.location}</p>
            </div>
          </div>

          {isSold ? (
            <div className="rounded-lg bg-slate-100 p-4 text-center text-sm font-medium text-slate-600">
              This item has been sold.
            </div>
          ) : isOwner ? (
            <div className="rounded-lg bg-slate-100 p-4 text-center text-sm font-medium text-slate-600">
              This is your listing. Manage it in your dashboard.
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
  onClick={handleBuyNow}
  size="lg"
  className="flex-1"
  disabled={buying}
>
  {buying ? "Redirecting..." : "Buy Now"}
</Button>
              <Button
  onClick={handleContactSeller}
  variant="secondary"
  size="lg"
  className="flex-1"
  disabled={starting}
>
  {starting ? "Opening chat..." : "Contact Seller"}
</Button>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}