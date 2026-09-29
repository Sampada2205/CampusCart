import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";
import Conversation from "@/models/Conversation";

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

// Safe helper: turns ANY value into a string id, or returns null.
function safeId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "toString" in (value as object)) {
    try {
      const s = (value as { toString: () => string }).toString();
      if (typeof s === "string" && s.length > 0) return s;
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const uid = user._id.toString();

    const raw = await Conversation.find({ participants: user._id })
      .sort({ lastMessageAt: -1 })
      .lean();

    const conversations: Array<{
      id: string;
      otherUser: {
        id: string;
        name: string;
        college: string;
        profileImage: string;
      } | null;
      product: {
        id: string;
        title: string;
        price: number;
        image: string;
        status: string;
      } | null;
      lastMessage: string;
      lastMessageAt: string;
      unread: number;
    }> = [];

    for (const c of raw) {
      // 1. Get participant ids safely
      const rawParticipants = Array.isArray(c.participants)
        ? c.participants
        : [];
      const participantIds = rawParticipants
        .map((p) => safeId(p))
        .filter((id): id is string => Boolean(id));

      if (participantIds.length < 2) continue;

      // 2. Find the other user's id
      const otherId = participantIds.find((id) => id !== uid);
      if (!otherId) continue;

      // 3. Look up the other user
      if (!mongoose.Types.ObjectId.isValid(otherId)) continue;
      const otherDoc = await User.findById(otherId).lean();
      if (!otherDoc) continue;
      const typedOtherDoc = otherDoc as unknown as {
        _id: mongoose.Types.ObjectId;
        name?: string;
        college?: string;
        profileImage?: string;
      };

      // 4. Look up the product
      const productId = safeId(c.product);
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) continue;
      const productDoc = await Product.findById(productId).lean();
      if (!productDoc) continue;
      const typedProductDoc = productDoc as unknown as {
        _id: mongoose.Types.ObjectId;
        title?: string;
        price?: number;
        images?: string[];
        status?: string;
      };

      // 5. Unread count — handle Map, plain object, or missing
      let unread = 0;
      const uMap = c.unreadCount as unknown;
      if (uMap instanceof Map) {
        unread = Number((uMap as Map<string, number>).get(uid) ?? 0);
      } else if (uMap && typeof uMap === "object") {
        unread = Number((uMap as Record<string, number>)[uid] ?? 0);
      }

      conversations.push({
        id: (c._id as mongoose.Types.ObjectId).toString(),
        otherUser: {
          id: (typedOtherDoc._id as mongoose.Types.ObjectId).toString(),
          name: typedOtherDoc.name ?? "Student",
          college: typedOtherDoc.college ?? "",
          profileImage: typedOtherDoc.profileImage ?? "",
        },
        product: {
          id: (typedProductDoc._id as mongoose.Types.ObjectId).toString(),
          title: typedProductDoc.title ?? "Product",
          price:
            typeof typedProductDoc.price === "number" ? typedProductDoc.price : 0,
          image:
            Array.isArray(typedProductDoc.images) && typedProductDoc.images[0]
              ? typedProductDoc.images[0]
              : "",
          status: typedProductDoc.status ?? "available",
        },
        lastMessage: c.lastMessage ?? "",
        lastMessageAt: (c.lastMessageAt ?? c.createdAt ?? new Date()).toString(),
        unread,
      });
    }

    const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

    return NextResponse.json({ conversations, totalUnread });
  } catch (error) {
    console.error("GET /api/conversations error:", error);
    const status = (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to load conversations";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const productId = body?.productId;

    if (
      typeof productId !== "string" ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return NextResponse.json(
        { error: "Invalid product id" },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.seller.toString() === user._id.toString()) {
      return NextResponse.json(
        { error: "You cannot start a chat on your own listing" },
        { status: 400 }
      );
    }

    const participants = [user._id, product.seller];

    let conversation = await Conversation.findOne({
      participants: { $all: participants, $size: 2 },
      product: product._id,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        product: product._id,
        lastMessage: "",
        lastMessageAt: new Date(),
      });
    }

    return NextResponse.json({
      conversationId: conversation._id.toString(),
    });
  } catch (error) {
    console.error("POST /api/conversations error:", error);
    const status = (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to start conversation";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const conversationId = body?.conversationId;

    if (
      typeof conversationId !== "string" ||
      !mongoose.Types.ObjectId.isValid(conversationId)
    ) {
      return NextResponse.json(
        { error: "Invalid conversation id" },
        { status: 400 }
      );
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(
      (p: mongoose.Types.ObjectId) => p && p.toString() === user._id.toString()
    );
    if (!isParticipant) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const uid = user._id.toString();
    if (!conversation.unreadCount) {
      conversation.unreadCount = new Map();
    }
    conversation.unreadCount.set(uid, 0);
    conversation.markModified("unreadCount");
    await conversation.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to mark as read";
    return NextResponse.json({ error: message }, { status });
  }
}
