import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

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

// GET /api/users/me — return the current user's profile
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        college: user.college,
        profileImage: user.profileImage ?? "",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status });
  }
}

// PATCH /api/users/me — update name, college, profileImage
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();

    const updates: Record<string, string> = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (name.length < 2) {
        return NextResponse.json(
          { error: "Name must be at least 2 characters" },
          { status: 400 }
        );
      }
      if (name.length > 60) {
        return NextResponse.json(
          { error: "Name is too long" },
          { status: 400 }
        );
      }
      updates.name = name;
    }

    if (typeof body.college === "string") {
      const college = body.college.trim();
      if (college.length < 2) {
        return NextResponse.json(
          { error: "College must be at least 2 characters" },
          { status: 400 }
        );
      }
      if (college.length > 100) {
        return NextResponse.json(
          { error: "College name is too long" },
          { status: 400 }
        );
      }
      updates.college = college;
    }

    if (typeof body.profileImage === "string") {
      const url = body.profileImage.trim();
      // Only accept Cloudinary URLs from our own cloud to prevent misuse
      const expectedPrefix = "https://res.cloudinary.com/";
      if (url && !url.startsWith(expectedPrefix)) {
        return NextResponse.json(
          { error: "Invalid profile image URL" },
          { status: 400 }
        );
      }
      updates.profileImage = url;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    user.set(updates);
    await user.save();

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        college: user.college,
        profileImage: user.profileImage ?? "",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status });
  }
}