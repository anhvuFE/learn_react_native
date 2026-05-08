import { useQuery } from "@apollo/client";
import {
  AppWindow,
  ChevronRight,
  Inbox,
  Lock,
  Mail,
  Sparkles,
  Timer,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  Button,
  GroupedCard,
  Hero,
  Section,
  Sep,
} from "../components/ui";
import { cn } from "../lib/cn";
import {
  CHILD_BANK_QUERY,
  MY_FAMILY_QUERY,
  PENDING_SUBMISSIONS,
  RESTRICTED_APPS_QUERY,
  TASKS_QUERY,
} from "../lib/queries";

interface FamilyData {
  myFamily: {
    id: string;
    childUids: string[];
    children: { uid: string; name?: string; email?: string; role: string }[];
  };
}

export default function DashboardPage() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { data: famData } = useQuery<FamilyData>(MY_FAMILY_QUERY);
  const { data: tasksData } = useQuery<{
    tasks: { id: string; status: string }[];
  }>(TASKS_QUERY);
  const { data: pendData } = useQuery<{
    pendingSubmissions: { id: string; childUid: string; submittedAt: string }[];
  }>(PENDING_SUBMISSIONS, { pollInterval: 30000 });
  const { data: appsData } = useQuery<{ restrictedApps: { id: string }[] }>(
    RESTRICTED_APPS_QUERY,
  );

  const family = famData?.myFamily;
  const children = useMemo(() => family?.children ?? [], [family?.children]);
  const tasks = tasksData?.tasks ?? [];
  const pending = pendData?.pendingSubmissions ?? [];
  const apps = appsData?.restrictedApps ?? [];

  const availableTasks = tasks.filter((t) => t.status === "available").length;

  const heroAccent = pending.length > 0 ? "orange" : "indigo";

  return (
    <div>
      {/* Greeting */}
      <div className="mb-3.5">
        <div className="text-[11px] font-semibold text-muted uppercase tracking-[0.6px]">
          {t("nav.parentDashboard").toUpperCase()}
        </div>
        <h1 className="text-[26px] font-bold text-text tracking-[-0.4px] mt-0.5">
          {t("dashboard.title")}
        </h1>
      </div>

      {/* Hero — pending review focus */}
      <Hero
        accent={heroAccent}
        icon={
          pending.length > 0 ? (
            <Mail size={20} color="#fff" strokeWidth={2.2} />
          ) : (
            <Sparkles size={20} color="#fff" strokeWidth={2.2} />
          )
        }
        label={
          pending.length > 0 ? "Waiting for review" : "All caught up"
        }
        value={`${pending.length}`}
        valueSuffix={pending.length === 1 ? "submission" : "submissions"}
        subtitle={
          pending.length > 0
            ? "Tap Submissions to approve or reject"
            : "Kids will appear here when they submit a mission"
        }
        chips={[
          {
            icon: <Users size={11} color="rgba(255,255,255,0.85)" strokeWidth={2.4} />,
            label: "Kids",
            value: `${children.length}`,
          },
          {
            icon: <Sparkles size={11} color="rgba(255,255,255,0.85)" strokeWidth={2.4} />,
            label: "Active",
            value: `${availableTasks}`,
          },
          {
            icon: <Lock size={11} color="rgba(255,255,255,0.85)" strokeWidth={2.4} />,
            label: "Locked apps",
            value: `${apps.length}`,
          },
        ]}
      />

      {pending.length > 0 && (
        <Section title="Pending review" rightLabelColor="#FF9500" rightLabel={`${pending.length} waiting`}>
          <GroupedCard>
            <button
              onClick={() => nav("/submissions")}
              className="w-full flex items-center px-3.5 py-3 hover:bg-black/[0.04] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-[9px] bg-warning-soft grid place-items-center mr-3 shrink-0">
                <Inbox size={17} className="text-warning" strokeWidth={2.4} />
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-medium text-text tracking-[-0.2px]">
                  {pending.length} submission{pending.length === 1 ? "" : "s"} to review
                </div>
                <div className="text-[12px] text-muted mt-0.5">
                  Approve or reject before kids can earn rewards
                </div>
              </div>
              <ChevronRight size={16} className="text-[#C7C7CC]" />
            </button>
          </GroupedCard>
        </Section>
      )}

      {/* Children */}
      <Section
        title="Children"
        rightLabel={children.length > 0 ? `${children.length}` : undefined}
      >
        {children.length === 0 ? (
          <GroupedCard className="px-6 py-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-accent-soft grid place-items-center mb-3">
              <Users size={22} className="text-accent" strokeWidth={2.2} />
            </div>
            <div className="text-[15px] font-semibold text-text">
              No children paired yet
            </div>
            <div className="text-[12px] text-muted mt-1 mb-4 max-w-xs">
              Generate a pairing code to invite your child&apos;s device
            </div>
            <Button onClick={() => nav("/pairing")}>Generate code</Button>
          </GroupedCard>
        ) : (
          <GroupedCard>
            {children.map((c, i) => (
              <div key={c.uid}>
                <ChildRow
                  uid={c.uid}
                  name={c.name ?? c.email?.split("@")[0] ?? "Child"}
                  pendingCount={
                    pending.filter((p) => p.childUid === c.uid).length
                  }
                  onClick={() => nav(`/children/${c.uid}`)}
                />
                {i < children.length - 1 && <Sep />}
              </div>
            ))}
          </GroupedCard>
        )}
      </Section>

      {/* Quick actions */}
      <Section title="Quick actions">
        <GroupedCard>
          <QuickActionRow
            icon={<Sparkles size={17} className="text-primary" strokeWidth={2.4} />}
            iconBg="rgba(52,199,89,0.12)"
            label="Add mission"
            subtitle="Create a custom task with rewards"
            onClick={() => nav("/tasks")}
          />
          <Sep />
          <QuickActionRow
            icon={<AppWindow size={17} className="text-accent" strokeWidth={2.4} />}
            iconBg="rgba(88,86,214,0.12)"
            label="Manage restricted apps"
            subtitle="Pick which apps require earned time"
            onClick={() => nav("/apps")}
          />
          <Sep />
          <QuickActionRow
            icon={<Wallet size={17} className="text-points" strokeWidth={2.4} />}
            iconBg="rgba(255,149,0,0.12)"
            label="Pair a new device"
            subtitle="Generate a 6-char code for a child phone"
            onClick={() => nav("/pairing")}
          />
        </GroupedCard>
      </Section>
    </div>
  );
}

function QuickActionRow({
  icon,
  iconBg,
  label,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center px-3.5 py-3 hover:bg-black/[0.04] transition-colors text-left"
    >
      <div
        className="w-8 h-8 rounded-[9px] grid place-items-center mr-3 shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-text tracking-[-0.2px]">
          {label}
        </div>
        <div className="text-[12px] text-muted mt-0.5 truncate">{subtitle}</div>
      </div>
      <ChevronRight size={16} className="text-[#C7C7CC]" />
    </button>
  );
}

function ChildRow({
  uid,
  name,
  pendingCount,
  onClick,
}: {
  uid: string;
  name: string;
  pendingCount: number;
  onClick: () => void;
}) {
  const { data } = useQuery<{
    childBank: {
      points: number;
      cashUsd: number;
      screenTimeMinutesRemaining: number;
      activeReward: { expiresAt: string } | null;
    };
  }>(CHILD_BANK_QUERY, { variables: { childUid: uid } });

  const bank = data?.childBank;
  const isUnlocked =
    bank?.activeReward &&
    new Date(bank.activeReward.expiresAt).getTime() > Date.now();

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center px-3.5 py-3 hover:bg-black/[0.04] transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-full bg-accent text-white grid place-items-center font-semibold text-sm mr-3 shrink-0">
        {name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-text tracking-[-0.2px] truncate">
          {name}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-[12px] text-muted">
            <Timer size={11} className="text-screentime" strokeWidth={2.4} />
            <span className="tabular-nums">
              {bank?.screenTimeMinutesRemaining ?? 0}m
            </span>
          </span>
          <span className="flex items-center gap-1 text-[12px] text-muted">
            <Sparkles size={11} className="text-points" strokeWidth={2.4} />
            <span className="tabular-nums">{bank?.points ?? 0}</span>
          </span>
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-warning">
              <Inbox size={11} strokeWidth={2.4} />
              <span>{pendingCount}</span>
            </span>
          )}
        </div>
      </div>
      <span
        className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-[0.4px] mr-2",
          isUnlocked
            ? "bg-primary-soft text-primary"
            : "bg-[rgba(120,120,128,0.12)] text-muted",
        )}
      >
        {isUnlocked ? "Unlocked" : "Locked"}
      </span>
      <ChevronRight size={16} className="text-[#C7C7CC]" />
    </button>
  );
}
