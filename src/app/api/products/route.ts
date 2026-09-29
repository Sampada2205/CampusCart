import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Product, {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
} from "@/models/Product";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const url = new URL(req.url);
    const search = url.searchParams.get("q")?.trim() ?? "";
    const category = url.searchParams.get("category") ?? "";
    const condition = url.searchParams.get("condition") ?? "";
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const sort = url.searchParams.get("sort") ?? "newest";
    const limit = Math.min(
      Number(url.searchParams.get("limit") ?? 24),
      60
    );

    const query: Record<string, unknown> = { status: "available" };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category && PRODUCT_CATEGORIES.includes(category as (typeof PRODUCT_CATEGORIES)[number])) {
      query.category = category;
    }

    if (condition && PRODUCT_CONDITIONS.includes(condition as (typeof PRODUCT_CONDITIONS)[number])) {
      query.condition = condition;
    }

    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      const min = Number(minPrice);
      const max = Number(maxPrice);
      if (!Number.isNaN(min) && minPrice) priceFilter.$gte = min;
      if (!Number.isNaN(max) && maxPrice) priceFilter.$lte = max;
      if (Object.keys(priceFilter).length) query.price = priceFilter;
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "newest") sortOption = { createdAt: -1 };

    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit)
      .populate("seller", "name college profileImage")
      .lean();

    const serialized = products.map((p) => {
      const seller = p.seller as unknown as {
        _id?: string;
        name?: string;
        college?: string;
        profileImage?: string;
      };

      return {
        id: (p._id as unknown as { toString(): string }).toString(),
        title: p.title,
        description: p.description,
        price: p.price,
        category: p.category,
        condition: p.condition,
        images: p.images,
        college: p.college,
        location: p.location,
        status: p.status,
        createdAt: p.createdAt,
        seller: seller
          ? {
              id: seller._id?.toString(),
              name: seller.name,
              college: seller.college,
              profileImage: seller.profileImage,
            }
          : null,
      };
    });

    return NextResponse.json({ products: serialized });
  } catch (error) {
    console.error("List products error:", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const {
      title,
      description,
      price,
      category,
      condition,
      college,
      location,
      images,
    } = body;

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof price !== "number" ||
      typeof category !== "string" ||
      typeof condition !== "string" ||
      typeof college !== "string" ||
      typeof location !== "string" ||
      !Array.isArray(images)
    ) {
      return NextResponse.json(
        { error: "Invalid product data" },
        { status: 400 }
      );
    }

    if (!PRODUCT_CATEGORIES.includes(category as (typeof PRODUCT_CATEGORIES)[number])) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!PRODUCT_CONDITIONS.includes(condition as (typeof PRODUCT_CONDITIONS)[number])) {
      return NextResponse.json({ error: "Invalid condition" }, { status: 400 });
    }
    if (price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please log in again." },
        { status: 404 }
      );
    }

    const product = await Product.create({
      title: title.trim(),
      description: description.trim(),
      price,
      category,
      condition,
      images: images.filter((url: unknown) => typeof url === "string"),
      seller: user._id,
      college: college.trim() || user.college,
      location: location.trim(),
      status: "available",
    });

    return NextResponse.json({
      product: {
        id: product._id.toString(),
        title: product.title,
      },
    });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
