"use client";

import { auth } from "@/lib/firebase";

export type ChatUser = {
  id: string;
  name: string;
  college: string;
  profileImage: string;
};

export type ChatProduct = {
  id: string;
  title: string;
  price: number;
  image: string;
  status: string;
};

export type ConversationSummary = {
  id: string;
  otherUser: ChatUser | null;
  product: ChatProduct | null;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
  seenAt: string | null;
};

async function authHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function startConversation(productId: string): Promise<string> {
  const headers = await authHeaders();
  const res = await fetch("/api/conversations", {
    method: "POST",
    headers,
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to start conversation");
  }
  const data = await res.json();
  return data.conversationId as string;
}

export async function fetchConversations(): Promise<{
  conversations: ConversationSummary[];
  totalUnread: number;
}> {
  const headers = await authHeaders();
  const res = await fetch("/api/conversations", { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load conversations");
  }
  const data = await res.json();
  return {
    conversations: data.conversations ?? [],
    totalUnread: data.totalUnread ?? 0,
  };
}

export async function fetchMessages(conversationId: string): Promise<{
  conversation: {
    id: string;
    otherUser: ChatUser | null;
    product: ChatProduct | null;
  };
  messages: ChatMessage[];
}> {
  const headers = await authHeaders();
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    headers,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load messages");
  }
  return res.json();
}

export async function sendMessage(
  conversationId: string,
  text: string
): Promise<ChatMessage> {
  const headers = await authHeaders();
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to send message");
  }
  const data = await res.json();
  return data.message as ChatMessage;
}

export async function markConversationRead(
  conversationId: string
): Promise<void> {
  const headers = await authHeaders();
  await fetch("/api/conversations", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ conversationId }),
  }).catch(() => {});
}