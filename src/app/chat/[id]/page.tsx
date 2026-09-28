"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchMessages,
  sendMessage,
  ChatMessage,
  ChatUser,
  ChatProduct,
} from "@/lib/chatClient";

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [product, setProduct] = useState<ChatProduct | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function load() {
      try {
        const data = await fetchMessages(params.id);
        if (cancelled) return;
        setMessages(data.messages);
        setOtherUser(data.conversation.otherUser);
        setProduct(data.conversation.product);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    interval = setInterval(load, 4000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [params.id, user, authLoading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setSending(true);
    try {
      const msg = await sendMessage(params.id, value);
      setMessages((prev) => [...prev, msg]);
      setText("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <ProtectedRoute>
      <Container className="py-10">
        <Link
          href="/chat"
          className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-800"
        >
          ← All conversations
        </Link>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!error && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="flex h-[70vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-slate-200 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {otherUser?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {otherUser?.name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {otherUser?.college ?? ""}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading && (
                  <p className="text-sm text-slate-500">Loading messages...</p>
                )}

                {!loading && messages.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No messages yet. Say hello!
                  </p>
                )}

                <ul className="flex flex-col gap-2">
  {messages.map((m, i) => {
    const mine = m.senderId === user?.uid;
    const isLast = i === messages.length - 1;
    const showSeen = mine && isLast && Boolean(m.seenAt);
    const prev = i > 0 ? messages[i - 1] : null;
    const showAvatar = !mine && (!prev || prev.senderId !== m.senderId);

    return (
      <li
        key={m.id}
        className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
      >
        {!mine && (
          <div className="w-7 flex-shrink-0">
            {showAvatar ? (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-[11px] font-bold text-slate-700">
                {otherUser?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            ) : null}
          </div>
        )}

        <div className={`flex max-w-[75%] flex-col ${mine ? "items-end" : "items-start"}`}>
          <div
            className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
              mine
                ? "rounded-br-md bg-blue-600 text-white"
                : "rounded-bl-md bg-slate-100 text-slate-900"
            }`}
          >
            {m.text}
          </div>
          {showSeen && (
            <span className="mt-1 text-[11px] text-slate-400">Seen</span>
          )}
        </div>
      </li>
    );
  })}
</ul>
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <form
                onSubmit={handleSend}
                className="flex gap-2 border-t border-slate-200 p-3"
              >
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <Button type="submit" disabled={sending || !text.trim()}>
                  {sending ? "..." : "Send"}
                </Button>
              </form>
            </div>

            {/* Product panel */}
           <aside className="hidden h-fit rounded-xl border border-slate-200 bg-white p-4 lg:block">
  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
    About this product
  </p>
  {product ? (
    <>
      {product.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image}
          alt={product.title}
          className="mt-3 h-40 w-full rounded-lg object-cover"
        />
      )}
      <p className="mt-3 text-sm font-semibold text-slate-900">
        {product.title}
      </p>
      <p className="mt-1 text-lg font-bold text-slate-900">
        ₹{product.price?.toLocaleString("en-IN") ?? 0}
      </p>
      <div className="mt-3">
        <Button
          href={`/product/${product.id}`}
          variant="secondary"
          size="sm"
          className="w-full"
        >
          View product
        </Button>
      </div>
    </>
  ) : (
    <p className="mt-3 text-sm text-slate-500">Product removed.</p>
  )}
</aside>
          </div>
        )}
      </Container>
    </ProtectedRoute>
  );
}