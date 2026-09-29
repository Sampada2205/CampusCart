import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

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

// GET /api/conversations/[id]/messages
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser(req);

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    }

    const conversation = (await Conversation.findById(params.id)
      .populate("participants", "name college profileImage")
      .populate("product", "title price images status")
      .lean()) as unknown as {
      _id: mongoose.Types.ObjectId;
      participants: Array<{ _id: mongoose.Types.ObjectId }>;
      product: unknown;
    } | null;

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant = (conversation.participants as unknown as Array<{ _id: mongoose.Types.ObjectId }>)
      .some((p) => p._id.toString() === user._id.toString());

    if (!isParticipant) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const messages = (await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .lean()) as unknown as Array<{
      _id: mongoose.Types.ObjectId;
      text: string;
      sender: mongoose.Types.ObjectId;
      createdAt: Date;
    }>;

    const parts = conversation.participants as unknown as Array<{
      _id: mongoose.Types.ObjectId;
      name: string;
      college: string;
      profileImage?: string;
    }>;

    const other = parts.find(
      (p) => p._id.toString() !== user._id.toString()
    );

    const product = conversation.product as unknown as {
      _id: mongoose.Types.ObjectId;
      title: string;
      price: number;
      images: string[];
      status: string;
    } | null;

    return NextResponse.json({
      conversation: {
        id: conversation._id.toString(),
        otherUser: other
          ? {
              id: other._id.toString(),
              name: other.name,
              college: other.college,
              profileImage: other.profileImage ?? "",
            }
          : null,
        product: product
          ? {
              id: product._id.toString(),
              title: product.title,
              price: product.price,
              image: product.images?.[0] ?? "",
              status: product.status,
            }
          : null,
      },
      messages: messages.map((m) => ({
        id: m._id.toString(),
        text: m.text,
        senderId: m.sender.toString(),
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to load messages";
    return NextResponse.json({ error: message }, { status });
  }
}

// POST /api/conversations/[id]/messages
// Body: { text: string }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser(req);

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    }

    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    const conversation = await Conversation.findById(params.id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(
      (p: mongoose.Types.ObjectId) => p.toString() === user._id.toString()
    );
    if (!isParticipant) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: user._id,
      text,
    });

    conversation.lastMessage = text;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    return NextResponse.json({
      message:{
  "id": "...",
  "text": "Hi",
  "senderId": "...",
  "createdAt": "2026-...",
  "seenAt": "2026-..." 
},
    });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: message }, { status });
  }
}
