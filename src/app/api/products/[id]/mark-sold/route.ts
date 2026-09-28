import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.seller.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "You can only mark your own listings" },
        { status: 403 }
      );
    }

    product.status = "sold";
    await product.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Mark sold error:", error);
    return NextResponse.json(
      { error: "Failed to mark as sold" },
      { status: 500 }
    );
  }
}