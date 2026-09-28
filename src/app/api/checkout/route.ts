import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const productId = body?.productId;

    if (
      typeof productId !== "string" ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    await connectToDatabase();

    const buyer = await User.findOne({ firebaseUid: decoded.uid });
    if (!buyer) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const product = await Product.findById(productId).populate(
      "seller",
      "name"
    );
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.status === "sold") {
      return NextResponse.json(
        { error: "This item is already sold" },
        { status: 400 }
      );
    }

    if (product.seller.toString() === buyer._id.toString()) {
      return NextResponse.json(
        { error: "You cannot buy your own listing" },
        { status: 400 }
      );
    }

    // IMPORTANT: use the price stored in MongoDB, never trust the client
    const amount = Math.round(product.price * 100); // Stripe uses smallest unit
    const currency = "inr";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: product.title,
              description: `${product.category} · ${product.condition}`,
              images: product.images.slice(0, 1),
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        buyerId: buyer._id.toString(),
        sellerId: product.seller._id.toString(),
        productId: product._id.toString(),
      },
      success_url: `${appUrl}/orders?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/product/${product._id}?status=cancelled`,
    });

    // Save a pending order so the webhook can find it
    await Order.create({
      buyer: buyer._id,
      seller: product.seller._id,
      product: product._id,
      amount: product.price,
      currency,
      status: "pending",
      stripeSessionId: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 }
    );
  }
}