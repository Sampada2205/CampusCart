import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Product, {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
} from "@/models/Product";

async function requireUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Missing token"), { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  const decoded = await adminAuth.verifyIdToken(token);
  await connectToDatabase();
  const user = await User.findOne({ firebaseUid: decoded.uid });
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  return user;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    await connectToDatabase();

    const product = await Product.findById(params.id)
      .populate("seller", "name college profileImage email")
      .lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const seller = product.seller as unknown as {
      _id?: string;
      name?: string;
      college?: string;
      profileImage?: string;
    };

    return NextResponse.json({
      product: {
        id: product._id.toString(),
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        condition: product.condition,
        images: product.images,
        college: product.college,
        location: product.location,
        status: product.status,
        createdAt: product.createdAt,
        seller: seller
          ? {
              id: seller._id?.toString() ?? "",
              name: seller.name ?? "",
              college: seller.college ?? "",
              profileImage: seller.profileImage ?? "",
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { error: "Failed to load product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser(req);

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.seller.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "You can only edit your own listings" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.title === "string" && body.title.trim()) {
      updates.title = body.title.trim();
    }
    if (typeof body.description === "string" && body.description.trim()) {
      updates.description = body.description.trim();
    }
    if (typeof body.price === "number" && body.price >= 0) {
      updates.price = body.price;
    }
    if (
      typeof body.category === "string" &&
      PRODUCT_CATEGORIES.includes(body.category)
    ) {
      updates.category = body.category;
    }
    if (
      typeof body.condition === "string" &&
      PRODUCT_CONDITIONS.includes(body.condition)
    ) {
      updates.condition = body.condition;
    }
    if (typeof body.college === "string" && body.college.trim()) {
      updates.college = body.college.trim();
    }
    if (typeof body.location === "string" && body.location.trim()) {
      updates.location = body.location.trim();
    }
    if (Array.isArray(body.images)) {
      updates.images = body.images.filter(
        (u: unknown) => typeof u === "string"
      );
    }
    if (body.status === "available" || body.status === "sold") {
      updates.status = body.status;
    }

    Object.assign(product, updates);
    await product.save();

    return NextResponse.json({
      product: {
        id: product._id.toString(),
        title: product.title,
        price: product.price,
        status: product.status,
      },
    });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser(req);

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.seller.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "You can only delete your own listings" },
        { status: 403 }
      );
    }

    await product.deleteOne();

    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ error: message }, { status });
  }
}