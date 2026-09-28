"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Container from "@/components/Container";
import Button from "@/components/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send reset email.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {sent ? (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 6h16v12H4z" />
                <path d="M4 6l8 6 8-6" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Check your email
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              If an account exists for <strong>{email}</strong>, we&apos;ve
              sent a password reset link. It usually arrives within a minute.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Don&apos;t see it? Check your spam folder or try again with a
              different email.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Button href="/login" className="w-full">
                Back to login
              </Button>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Use a different email
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900">
              Forgot your password?
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Remembered it?{" "}
              <a
                href="/login"
                className="font-medium text-blue-600 hover:underline"
              >
                Log in
              </a>
            </p>
          </>
        )}
      </div>
    </Container>
  );
}