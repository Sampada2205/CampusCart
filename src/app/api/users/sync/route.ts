import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const college = typeof body.college === "string" ? body.college.trim() : "";

    await connectToDatabase();

    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email ?? "",
        name: name || decoded.name || (decoded.email ?? "Student").split("@")[0],
        college: college || "Not set",
        profileImage: decoded.picture ?? "",
      });
    } else {
      const updates: Record<string, string> = {};
      if (name && name !== user.name) updates.name = name;
      if (college && college !== user.college) updates.college = college;
      if (decoded.picture && decoded.picture !== user.profileImage) {
        updates.profileImage = decoded.picture;
      }
      if (Object.keys(updates).length) {
        user.set(updates);
        await user.save();
      }
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        college: user.college,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Sync user error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to sync user",
      },
      { status: 500 }
    );
  }
}