import Container from "@/components/Container";
import Button from "@/components/Button";
import ProductCard, { ProductCardData } from "@/components/ProductCard";

const categories = [
  { name: "Books", emoji: "📚" },
  { name: "Notes", emoji: "📝" },
  { name: "Electronics", emoji: "💻" },
  { name: "Gadgets", emoji: "🎧" },
  { name: "Stationery", emoji: "✏️" },
  { name: "Other", emoji: "📦" },
];

async function getFeaturedProducts(): Promise<ProductCardData[]> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/products?limit=4&sort=newest`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products ?? []) as ProductCardData[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const featured = await getFeaturedProducts();

  return (
    <div className="flex flex-col">
      <section className="border-b border-slate-200 bg-white">
        <Container className="flex flex-col items-center gap-8 py-20 text-center sm:py-28">
          <span className="rounded-full bg-blue-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Campus-only marketplace
          </span>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Buy and sell on campus with{" "}
            <span className="text-blue-600">CampusCart</span>
          </h1>

          <p className="max-w-2xl text-lg text-slate-600">
            A simple, secure marketplace for students to trade books, notes,
            gadgets, and more — right inside your college.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/marketplace" size="lg">
              Browse Marketplace
            </Button>
            <Button href="/sell" variant="secondary" size="lg">
              Start Selling
            </Button>
          </div>
        </Container>
      </section>

      <section className="border-b border-slate-200 bg-slate-50">
        <Container className="py-14">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              Browse by category
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Find exactly what you need, fast.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <a
                key={category.name}
                href={`/marketplace?category=${category.name}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-5 text-center transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm"
              >
                <span className="text-2xl">{category.emoji}</span>
                <span className="text-sm font-medium text-slate-700">
                  {category.name}
                </span>
              </a>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white">
        <Container className="py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Fresh on CampusCart
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Recently listed items from students near you.
              </p>
            </div>
            <Button href="/marketplace" variant="ghost" size="sm">
              View all →
            </Button>
          </div>

          {featured.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
              <p className="text-slate-500">
                No products listed yet. Be the first to sell something!
              </p>
              <div className="mt-4">
                <Button href="/sell" size="sm">
                  List an Item
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Container>
      </section>

      <section className="border-t border-slate-200 bg-slate-900">
        <Container className="flex flex-col items-center gap-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Have something to sell?
          </h2>
          <p className="max-w-xl text-slate-300">
            Turn your unused books, notes, and gadgets into cash. List an item
            in under a minute.
          </p>
          <Button href="/sell" size="lg">
            List an Item
          </Button>
        </Container>
      </section>
    </div>
  );
}