"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "./Container";
import NavTooltip, { NavTooltipItem } from "./NavTooltip";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { fetchConversations } from "@/lib/chatClient";
import {
  IconDashboard,
  IconChat,
  IconOrders,
  IconHeart,
  IconUser,
  IconLogout,
  IconLogin,
  IconUserPlus,
} from "./icons";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/sell", label: "Sell" },
];

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadTotal(0);
      return;
    }

    let cancelled = false;

    async function loadUnread() {
      try {
        const data = await fetchConversations();
        if (!cancelled) {
          setUnreadTotal(Number(data?.totalUnread ?? 0));
        }
      } catch {
        // silent — this runs in the background
      }
    }

    loadUnread();
    const interval = setInterval(loadUnread, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  async function handleLogout() {
    await signOut(auth);
    router.push("/");
  }

  const guestItems: NavTooltipItem[] = [
    { icon: <IconLogin />, tooltip: "Log in", href: "/login" },
    { icon: <IconUserPlus />, tooltip: "Sign up", href: "/signup" },
  ];

  const userItems: NavTooltipItem[] = [
    { icon: <IconDashboard />, tooltip: "Dashboard", href: "/dashboard" },
    {
      icon: (
        <span className="relative inline-flex">
          <IconChat />
          {unreadTotal > 0 && (
            <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
              {unreadTotal > 9 ? "9+" : unreadTotal}
            </span>
          )}
        </span>
      ),
      tooltip: "Messages",
      href: "/chat",
    },
    { icon: <IconOrders />, tooltip: "Orders", href: "/orders" },
    { icon: <IconHeart />, tooltip: "Wishlist", href: "/wishlist" },
    { icon: <IconUser />, tooltip: "Profile", href: "/profile" },
    { icon: <IconLogout />, tooltip: "Log out", onClick: handleLogout },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            C
          </span>
          <span className="text-lg font-bold text-slate-900">CampusCart</span>
        </Link>

        {/* Center navigation — text stays text */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side — icons with tooltips when logged in */}
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-sm text-slate-400">...</span>
          ) : user ? (
            <>
              <span className="nav-divider hidden md:block" />
              <NavTooltip id="nav-user-tt" items={userItems} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-block"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}