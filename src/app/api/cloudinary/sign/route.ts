import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    await adminAuth.verifyIdToken(token);

    const timestamp = Math.round(Date.now() / 1000);
   const url = new URL(req.url);
const folderParam = url.searchParams.get("folder");
const allowed = ["products", "profiles"];
const requested = folderParam && allowed.includes(folderParam) ? folderParam : "products";
const folder = `campuscart/${requested}`;
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET as string
    );

    return NextResponse.json({
      timestamp,
      folder,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    console.error("Cloudinary sign error:", error);
    return NextResponse.json(
      { error: "Failed to sign upload" },
      { status: 500 }
    );
  }
}