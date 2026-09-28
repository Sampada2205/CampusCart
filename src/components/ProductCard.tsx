import Link from "next/link";

export type ProductCardData = {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  college: string;
  location?: string;
};

type Props = {
  product: ProductCardData;
};

export default function ProductCard({ product }: Props) {
  const image = product.images?.[0];

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="aspect-square w-full overflow-hidden bg-slate-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
          {product.category}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
          {product.title}
        </h3>
        <p className="mt-1 text-lg font-bold text-slate-900">
          ₹{product.price.toLocaleString("en-IN")}
        </p>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <span>{product.condition}</span>
          {product.college && (
            <span className="truncate">{product.college}</span>
          )}
        </div>
      </div>
    </Link>
  );
}