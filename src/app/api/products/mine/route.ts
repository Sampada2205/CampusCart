import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    await connectToDatabase();
    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const products = await Product.find({ seller: user._id })
      .sort({ createdAt: -1 })
      .lean();

    const serialized = products.map((p) => ({
      id: p._id.toString(),
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
    }));

    return NextResponse.json({ products: serialized });
  } catch (error) {
    console.error("List my products error:", error);
    return NextResponse.json(
      { error: "Failed to load your listings" },
      { status: 500 }
    );
  }
}