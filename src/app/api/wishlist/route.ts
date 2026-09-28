import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Wishlist from "@/models/Wishlist";
import Product from "@/models/Product";
import mongoose from "mongoose";

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

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);

    const items = await Wishlist.find({ user: user._id })
      .populate({
        path: "product",
        select:
          "title price category condition images college location status",
      })
      .sort({ createdAt: -1 })
      .lean();

    const products = items
      .map((item) => item.product as unknown as {
        _id: mongoose.Types.ObjectId;
        title: string;
        price: number;
        category: string;
        condition: string;
        images: string[];
        college: string;
        location: string;
        status: string;
      } | null)
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({
        id: p._id.toString(),
        title: p.title,
        price: p.price,
        category: p.category,
        condition: p.condition,
        images: p.images,
        college: p.college,
        location: p.location,
        status: p.status,
      }));

    return NextResponse.json({ products });
  } catch (error) {
    const status =
      (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to load wishlist";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const productId = body?.productId;

    if (typeof productId !== "string" || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await Wishlist.updateOne(
      { user: user._id, product: product._id },
      { $setOnInsert: { user: user._id, product: product._id } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const status =
      (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to add to wishlist";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const productId = body?.productId;

    if (typeof productId !== "string" || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    await Wishlist.deleteOne({ user: user._id, product: productId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status =
      (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to remove from wishlist";
    return NextResponse.json({ error: message }, { status });
  }
}