import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Wishlist from "@/models/Wishlist";

export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ inWishlist: false });
    }
    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    await connectToDatabase();
    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) return NextResponse.json({ inWishlist: false });

    const exists = await Wishlist.exists({
      user: user._id,
      product: params.productId,
    });

    return NextResponse.json({ inWishlist: Boolean(exists) });
  } catch {
    return NextResponse.json({ inWishlist: false });
  }
}
