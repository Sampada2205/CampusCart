import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";

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

    const orders = await Order.find({ seller: user._id })
      .populate("product", "title images category condition")
      .populate("buyer", "name college")
      .sort({ createdAt: -1 })
      .lean();

    const result = orders.map((o) => {
      const product = o.product as unknown as {
        _id: string;
        title: string;
        images: string[];
        category: string;
        condition: string;
      } | null;
      const buyer = o.buyer as unknown as {
        _id: string;
        name: string;
        college: string;
      } | null;

      return {
        id: (o._id as unknown as { toString(): string }).toString(),
        amount: o.amount,
        currency: o.currency,
        status: o.status,
        createdAt: o.createdAt,
        product: product
          ? {
              id: product._id.toString(),
              title: product.title,
              image: product.images?.[0] ?? "",
              category: product.category,
              condition: product.condition,
            }
          : null,
        buyer: buyer
          ? {
              id: buyer._id.toString(),
              name: buyer.name,
              college: buyer.college,
            }
          : null,
      };
    });

    return NextResponse.json({ orders: result });
  } catch (error) {
    console.error("List sales error:", error);
    return NextResponse.json(
      { error: "Failed to load sales" },
      { status: 500 }
    );
  }
}
