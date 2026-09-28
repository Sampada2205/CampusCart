"use client";

import { auth } from "@/lib/firebase";

export async function uploadToCloudinary(
  file: File,
  folder: "products" | "profiles" = "products"
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Not signed in");

  const token = await currentUser.getIdToken();

  const signRes = await fetch(`/api/cloudinary/sign?folder=${folder}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!signRes.ok) {
    throw new Error("Failed to get upload signature");
  }

  const { timestamp, folder: signedFolder, signature, apiKey, cloudName } =
    await signRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", signedFolder);
  formData.append("signature", signature);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!uploadRes.ok) {
    const data = await uploadRes.json().catch(() => ({}));
    throw new Error(data.error?.message || "Upload failed");
  }

  const data = await uploadRes.json();
  return data.secure_url as string;
}