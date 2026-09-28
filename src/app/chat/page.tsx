"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Container from "@/components/Container";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchConversations,
  ConversationSummary,
} from "@/lib/chatClient";

function ChatListInner() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchConversations();
        const safe = (data.conversations ?? []).filter(
          (c): c is ConversationSummary =>
            Boolean(c) && typeof c.id === "string" && c.id.length > 0
        );
        setConversations(safe);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading]);

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
      <p className="mt-2 text-sm text-slate-500">
        Conversations with buyers and sellers.
      </p>

      <div className="mt-8">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <p className="text-slate-500">No conversations yet.</p>
            <p className="mt-1 text-sm text-slate-400">
              Start one by clicking &quot;Contact Seller&quot; on any product.
            </p>
          </div>
        )}

        {!loading && !error && conversations.length > 0 && (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {conversations.map((c) => {
              const hasUnread = (c.unread ?? 0) > 0;
              const otherName = c.otherUser?.name ?? "Student";
              const productTitle = c.product?.title ?? "Product";
              const image = c.product?.image;

              return (
                <li key={c.id}>
                  <Link
                    href={`/chat/${c.id}`}
                    className={`flex items-center gap-4 p-4 transition ${
                      hasUnread
                        ? "bg-blue-50/50 hover:bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={productTitle}
                        className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 flex-shrink-0 rounded-lg bg-slate-100" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          hasUnread
                            ? "font-bold text-slate-900"
                            : "font-semibold text-slate-700"
                        }`}
                      >
                        {otherName}{" "}
                        <span
                          className={
                            hasUnread
                              ? "font-medium text-slate-700"
                              : "font-normal text-slate-500"
                          }
                        >
                          · {productTitle}
                        </span>
                      </p>
                      <p
                        className={`mt-1 truncate text-sm ${
                          hasUnread
                            ? "font-medium text-slate-900"
                            : "text-slate-500"
                        }`}
                      >
                        {c.lastMessage || "No messages yet"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {hasUnread && (
                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                          {c.unread > 9 ? "9+" : c.unread}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {c.lastMessageAt
                          ? new Date(c.lastMessageAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Container>
  );
}

export default function ChatListPage() {
  return (
    <ProtectedRoute>
      <ChatListInner />
    </ProtectedRoute>
  );
}