import { useQuery } from "@apollo/client";
import { sendEmailVerification } from "firebase/auth";
import {
  Activity,
  AppWindow,
  CheckSquare,
  ChevronRight,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MailWarning,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/cn";
import { ME_QUERY, PENDING_SUBMISSIONS } from "../lib/queries";

interface NavItem {
  to: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  badgeKey?: "submissions";
}

const NAV: NavItem[] = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, end: true },
  { to: "/tasks", labelKey: "nav.tasks", icon: CheckSquare },
  { to: "/submissions", labelKey: "nav.submissions", icon: Inbox, badgeKey: "submissions" },
  { to: "/activity", labelKey: "nav.activity", icon: Activity },
  { to: "/children", labelKey: "nav.children", icon: Users },
  { to: "/apps", labelKey: "nav.apps", icon: AppWindow },
  { to: "/pairing", labelKey: "nav.pairing", icon: KeyRound },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: meData } = useQuery<{
    me: { uid: string; name?: string; email?: string; role: string };
  }>(ME_QUERY, { fetchPolicy: "cache-first" });

  const { data: pendData } = useQuery<{
    pendingSubmissions: { id: string }[];
  }>(PENDING_SUBMISSIONS, { pollInterval: 30000 });

  const pendingCount = pendData?.pendingSubmissions?.length ?? 0;
  const me = meData?.me;
  const displayName = me?.name ?? me?.email?.split("@")[0] ?? "Parent";

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin", { replace: true });
  };

  return (
    <div className="h-full flex bg-bg">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-surface border-r border-border flex flex-col">
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center">
              <Shield size={18} color="white" strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-tight text-text">
                ScreenMindr
              </div>
              <div className="text-[11px] text-muted font-medium">
                {t("nav.parentDashboard")}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map(({ to, labelKey, icon: Icon, end, badgeKey }) => (
            <NavLink
              key={to}
              to={to}
              end={end ?? false}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors",
                  isActive
                    ? "bg-text text-white"
                    : "text-text/80 hover:bg-surface-alt",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    strokeWidth={2.2}
                    color={isActive ? "white" : "#6E6E73"}
                  />
                  <span className="flex-1">{t(labelKey)}</span>
                  {badgeKey === "submissions" && pendingCount > 0 && (
                    <span
                      className={cn(
                        "min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold grid place-items-center",
                        isActive
                          ? "bg-white text-text"
                          : "bg-warning text-white",
                      )}
                    >
                      {pendingCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-accent text-white font-bold grid place-items-center text-sm">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-text truncate">
                {displayName}
              </div>
              <div className="text-[11px] text-muted truncate">{me?.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-8 h-8 rounded-lg hover:bg-surface-alt grid place-items-center"
              title={t("nav.signOut")}
            >
              <LogOut size={15} color="#6E6E73" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <EmailVerificationBanner />
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>

      {user && me?.role === "child" && (
        <div className="absolute inset-x-0 top-0 bg-warning text-white text-center py-2 text-sm font-semibold flex items-center justify-center gap-2">
          You signed in as a child — this dashboard is for parents only
          <ChevronRight size={14} />
          <button onClick={handleSignOut} className="underline">
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function EmailVerificationBanner() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!user || !user.email || user.emailVerified || dismissed) return null;

  const resend = async () => {
    setBusy(true);
    try {
      await sendEmailVerification(user);
      alert(`Verification email sent to ${user.email}.`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-warning text-white px-5 py-2.5 flex items-center gap-3">
      <MailWarning size={16} strokeWidth={2.4} />
      <div className="flex-1 text-[13px] font-medium">
        Verify your email — open the link sent to{" "}
        <span className="font-bold">{user.email}</span>
      </div>
      <button
        onClick={resend}
        disabled={busy}
        className="bg-white/20 hover:bg-white/30 text-[12px] font-bold px-3 py-1 rounded-full disabled:opacity-60"
      >
        {busy ? "Sending…" : "Resend"}
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="hover:bg-white/15 rounded-md p-1"
      >
        <X size={14} />
      </button>
    </div>
  );
}
