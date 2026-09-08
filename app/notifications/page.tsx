"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { Bell, Check, CheckCheck, ArrowLeft, Clock } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Lazy client initialization
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const updateAppBadge = useCallback((unreadCount: number) => {
    if (typeof window !== "undefined" && "setAppBadge" in navigator) {
      if (unreadCount > 0) {
        navigator.setAppBadge(unreadCount).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const uniqueData = data.filter(
          (item, index, self) =>
            index ===
            self.findIndex(
              (t) =>
                t.id === item.id ||
                (t.title === item.title && t.message === item.message)
            )
        );

        setItems(uniqueData);
        updateAppBadge(uniqueData.filter((n) => !n.is_read).length);
      }
    } else {
      setUserId(null);

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const uniqueAnnouncements = data.filter(
          (item, index, self) =>
            index ===
            self.findIndex(
              (a) =>
                a.id === item.id ||
                (a.title === item.title && a.description === item.description)
            )
        );

        const guestNotifs: NotificationItem[] = uniqueAnnouncements.map((a) => {
          let cleanTitle = a.title || "";
          if (cleanTitle.toLowerCase().startsWith("new announcement:")) {
            cleanTitle = cleanTitle.replace(/^new announcement:\s*/i, "");
          }

          return {
            id: a.id,
            title: cleanTitle,
            message: a.description || "",
            link: "/",
            is_read: false,
            created_at: a.event_date || a.created_at,
          };
        });

        setItems(guestNotifs);
        updateAppBadge(guestNotifs.length);
      }
    }

    setLoading(false);
  }, [supabase, updateAppBadge]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const initialize = async () => {
      await fetchNotifications();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const channelName = user ? `notifs_user_${user.id}` : "notifs_guest";
      supabase.removeChannel(supabase.channel(channelName));

      if (user) {
        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            () => fetchNotifications()
          );
      } else {
        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "announcements",
            },
            () => fetchNotifications()
          );
      }

      channel.subscribe();
    };

    initialize();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, fetchNotifications]);

  const markAsRead = async (id: string) => {
    if (userId) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    }
    setItems((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      updateAppBadge(updated.filter((n) => !n.is_read).length);
      return updated;
    });
  };

  const markAllAsRead = async () => {
    if (userId) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
    }
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    updateAppBadge(0);
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-amber-300 text-sm font-medium transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>

        {/* Header section with professional styling */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                <Bell className="w-6 h-6 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                System Updates & <span className="text-amber-400">Announcements</span>
              </h1>
            </div>
            <p className="text-sm text-slate-400 pl-1">
              Stay informed with the latest broadcasts, alerts, and platform announcements.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400/20 to-amber-500/10 border border-amber-400/30 text-amber-300 hover:from-amber-400/30 hover:to-amber-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_20px_rgba(251,191,36,0.1)] hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <CheckCheck className="w-4 h-4" /> Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading updates...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 border border-white/10 rounded-2xl bg-slate-900/40 backdrop-blur-xl text-center space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 border border-white/5">
              <Bell className="w-5 h-5 opacity-40" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">All caught up!</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              There are currently no new notifications or announcements to display. Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((n, index) => {
              let displayTitle = n.title || "";
              if (displayTitle.toLowerCase().startsWith("new announcement:")) {
                displayTitle = displayTitle.replace(/^new announcement:\s*/i, "");
              }

              return (
                <div
                  key={n.id}
                  style={{ animationDelay: `${index * 80}ms` }}
                  className={`group relative p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards ${
                    n.is_read
                      ? "bg-slate-900/30 border-white/5 opacity-75 hover:opacity-100 hover:border-white/10"
                      : "bg-slate-900/90 border-amber-400/40 shadow-[0_8px_30px_rgba(0,0,0,0.5),_0_0_20px_rgba(251,191,36,0.07)] hover:border-amber-400/60"
                  }`}
                >
                  {/* Subtle highlight border effect on unread cards */}
                  {!n.is_read && (
                    <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none" />
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {!n.is_read && (
                          <span className="relative flex h-3 w-3 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"></span>
                          </span>
                        )}
                        <h3 className={`font-bold tracking-tight text-base sm:text-lg transition-colors ${
                          n.is_read ? "text-slate-300" : "text-amber-200 animate-pulse"
                        }`} style={{ animationDuration: n.is_read ? undefined : "1.2s" }}>
                          {displayTitle}
                        </h3>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed font-normal whitespace-pre-wrap">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-xs text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 hover:bg-amber-400/20 hover:border-amber-400/50 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all duration-200 shadow-sm active:scale-95"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Mark read</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}