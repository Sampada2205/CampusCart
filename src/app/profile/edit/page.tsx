"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import { fetchProfile, updateProfile, Profile } from "@/lib/profileClient";

function EditInner() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchProfile();
        setProfile(data);
        setName(data.name);
        setCollege(data.college);
        setProfileImage(data.profileImage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    setError("");
    setUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const url = await uploadToCloudinary(file, "profiles");
      setProfileImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreviewUrl("");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const updated = await updateProfile({ name, college, profileImage });
      setProfile(updated);
      setSuccess("Profile updated successfully.");
      // Return to profile view after a short moment
      setTimeout(() => {
        router.push("/profile");
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container className="py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 text-sm text-slate-500 hover:text-slate-800"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold text-slate-900">Edit profile</h1>
      <p className="mt-2 text-sm text-slate-500">
        Update your name, college, and profile photo.
      </p>

      {loading && (
        <div className="mt-8 h-64 animate-pulse rounded-xl bg-slate-100" />
      )}

      {!loading && profile && (
        <form
          onSubmit={handleSave}
          className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {/* Left: main fields */}
          <div className="lg:col-span-2 flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6">
            <div>
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={60}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                College
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Email cannot be changed.
              </p>
            </div>
          </div>

          {/* Right: avatar + save */}
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-700">
                Profile photo
              </p>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-blue-600 text-2xl font-bold text-white">
                  {previewUrl || profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl || profileImage}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    name?.[0]?.toUpperCase() ?? "?"
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Change photo"}
                  </Button>
                  {profileImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileImage("");
                        setPreviewUrl("");
                      }}
                      className="text-xs text-slate-500 hover:text-red-600"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                JPG, PNG, or WebP. Max 5 MB.
              </p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                {success}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={saving || uploading}
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
            <Button
              href="/profile"
              variant="ghost"
              className="w-full"
              type="button"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Container>
  );
}

export default function EditProfilePage() {
  return (
    <ProtectedRoute>
      <EditInner />
    </ProtectedRoute>
  );
}