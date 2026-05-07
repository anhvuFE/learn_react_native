import { useQuery } from "@apollo/client";
import {
  AppWindow,
  Inbox,
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
  Card,
  PageHeader,
  SectionLabel,
  StatTile,
} from "../components/ui";
import { cn } from "../lib/cn";
import {
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
  const { data: tasksData } = useQuery<{ tasks: { id: string; status: string }[] }>(
    TASKS_QUERY,
  );
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

  return (
    <div>
      <PageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
      />

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatTile
          label={t("dashboard.children")}
          value={`${children.length}`}
          icon={<Users size={16} className="text-accent" strokeWidth={2.4} />}
          accent="accent"
        />
        <StatTile
          label={t("dashboard.pendingReview")}
          value={`${pending.length}`}
          icon={<Inbox size={16} className="text-warning" strokeWidth={2.4} />}
          accent="warning"
        />
        <StatTile
          label={t("dashboard.activeMissions")}
          value={`${availableTasks}`}
          icon={
            <Sparkles size={16} className="text-primary" strokeWidth={2.4} />
          }
          accent="primary"
        />
        <StatTile
          label={t("dashboard.appsLocked")}
          value={`${apps.length}`}
          icon={<AppWindow size={16} className="text-text" strokeWidth={2.4} />}
        />
      </div>

      {pending.length > 0 && (
        <Card className="mb-6 px-5 py-4 bg-warning/10 border-warning/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold text-text">
                {pending.length} submission{pending.length === 1 ? "" : "s"}{" "}
                waiting for your review
              </div>
              <div className="text-[12px] text-muted mt-0.5">
                Approve or reject before kids can earn rewards
              </div>
            </div>
            <Button onClick={() => nav("/submissions")}>Review</Button>
          </div>
        </Card>
      )}

      <SectionLabel>Children</SectionLabel>
      {children.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="text-[14px] font-semibold text-text">
            No children paired yet
          </div>
          <div className="text-[12px] text-muted mt-1 mb-4">
            Generate a pairing code to invite your child's device
          </div>
          <Button onClick={() => nav("/pairing")}>Generate code</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {children.map((c) => (
            <ChildSummaryCard
              key={c.uid}
              uid={c.uid}
              name={c.name ?? c.email?.split("@")[0] ?? "Child"}
              onClick={() => nav(`/children/${c.uid}`)}
              pendingCount={
                pending.filter((p) => p.childUid === c.uid).length
              }
            />
          ))}
        </div>
      )}

      <SectionLabel>Quick actions</SectionLabel>
      <div className="grid grid-cols-3 gap-3">
        <Card
          onClick={() => nav("/tasks")}
          className="p-5 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-soft grid place-items-center">
            <Sparkles size={18} className="text-primary" strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-text">Add mission</div>
            <div className="text-[12px] text-muted mt-0.5">
              Create a custom task with rewards
            </div>
          </div>
        </Card>
        <Card
          onClick={() => nav("/apps")}
          className="p-5 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-soft grid place-items-center">
            <AppWindow size={18} className="text-accent" strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-text">
              Manage apps
            </div>
            <div className="text-[12px] text-muted mt-0.5">
              Choose which apps require earned time
            </div>
          </div>
        </Card>
        <Card
          onClick={() => nav("/pairing")}
          className="p-5 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-points-soft grid place-items-center">
            <Wallet size={18} className="text-points" strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-text">
              Pair a device
            </div>
            <div className="text-[12px] text-muted mt-0.5">
              Generate a 6-char code for a child phone
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { useQuery as useQ } from "@apollo/client";
import { CHILD_BANK_QUERY } from "../lib/queries";

function ChildSummaryCard({
  uid,
  name,
  onClick,
  pendingCount,
}: {
  uid: string;
  name: string;
  onClick: () => void;
  pendingCount: number;
}) {
  const { data } = useQ<{
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
    <Card onClick={onClick} className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-accent text-white grid place-items-center font-bold text-base">
          {name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-text truncate">
            {name}
          </div>
          <div className="text-[12px] text-muted truncate">{uid}</div>
        </div>
        <div
          className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
            isUnlocked
              ? "bg-primary-soft text-primary"
              : "bg-surface-alt text-muted",
          )}
        >
          {isUnlocked ? "Unlocked" : "Locked"}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
        <Stat icon={<Timer size={13} />} label="Min" value={`${bank?.screenTimeMinutesRemaining ?? 0}`} />
        <Stat icon={<Sparkles size={13} />} label="Pts" value={`${bank?.points ?? 0}`} />
        <Stat
          icon={<Wallet size={13} />}
          label="Cash"
          value={`$${(bank?.cashUsd ?? 0).toFixed(2)}`}
        />
      </div>
      {pendingCount > 0 && (
        <div className="mt-3 text-[11px] font-bold text-warning bg-warning/10 rounded-lg px-2.5 py-1.5">
          {pendingCount} pending submission{pendingCount === 1 ? "" : "s"}
        </div>
      )}
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-muted">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-[16px] font-bold text-text mt-0.5 tabular-nums">
        {value}
      </div>
    </div>
  );
}
