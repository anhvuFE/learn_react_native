import { useQuery } from "@apollo/client";
import {
  Camera,
  Check,
  Footprints,
  Gift,
  HelpCircle,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";
import { Card, Empty, PageHeader, SectionLabel } from "../components/ui";
import { cn } from "../lib/cn";
import { FAMILY_ACTIVITY, MY_FAMILY_QUERY } from "../lib/queries";

interface Event {
  id: string;
  kind: string;
  occurredAt: string;
  childUid: string;
  taskId?: string;
  taskTitle?: string;
  taskType?: string;
  rewardType?: string;
  rewardAmount?: number;
  rejectionReason?: string;
  quizScore?: number;
}

const KINDS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "reward_granted", label: "Rewards" },
];

export default function ActivityPage() {
  const [childUid, setChildUid] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");

  const { data: famData } = useQuery<{
    myFamily: { children: { uid: string; name?: string; email?: string }[] };
  }>(MY_FAMILY_QUERY);
  const children = famData?.myFamily?.children ?? [];

  const { data, loading } = useQuery<{ familyActivity: Event[] }>(
    FAMILY_ACTIVITY,
    {
      variables: { childUid: childUid === "all" ? null : childUid, limit: 200 },
    },
  );

  const events = (data?.familyActivity ?? []).filter(
    (e) => kind === "all" || e.kind === kind,
  );

  const grouped = groupByDay(events);

  return (
    <div>
      <PageHeader
        title="Activity"
        subtitle="Everything that happened in your family — submissions, approvals, rewards"
      />

      <div className="flex gap-3 mb-6 flex-wrap">
        <FilterPill label="Child:" />
        <button
          onClick={() => setChildUid("all")}
          className={chipCls(childUid === "all")}
        >
          All children
        </button>
        {children.map((c) => (
          <button
            key={c.uid}
            onClick={() => setChildUid(c.uid)}
            className={chipCls(childUid === c.uid)}
          >
            {c.name ?? c.email?.split("@")[0] ?? c.uid.slice(0, 6)}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <FilterPill label="Type:" />
        {KINDS.map((k) => (
          <button
            key={k.value}
            onClick={() => setKind(k.value)}
            className={chipCls(kind === k.value)}
          >
            {k.label}
          </button>
        ))}
      </div>

      {loading && events.length === 0 ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : events.length === 0 ? (
        <Empty title="No activity matches" subtitle="Try a different filter" />
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <SectionLabel>{day}</SectionLabel>
              <div className="space-y-2">
                {items.map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    childName={
                      children.find((c) => c.uid === e.childUid)?.name ??
                      e.childUid.slice(0, 6)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <span className="text-[12px] font-bold text-muted self-center uppercase tracking-wider">
      {label}
    </span>
  );
}

function chipCls(active: boolean) {
  return cn(
    "px-3 py-1.5 rounded-full text-[12px] font-semibold",
    active
      ? "bg-text text-white"
      : "bg-surface border border-border text-muted hover:border-text/30",
  );
}

function EventRow({ event, childName }: { event: Event; childName: string }) {
  const { icon, color, bg, label } = describeKind(event.kind);
  const time = new Date(event.occurredAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="px-4 py-3 flex items-center gap-3">
      <div
        className={cn("w-9 h-9 rounded-lg grid place-items-center", bg)}
      >
        <span className={color}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-text">
          <span className="font-bold">{childName}</span>{" "}
          <span className="text-muted">{label}</span>{" "}
          <span className="font-semibold">{event.taskTitle ?? "a mission"}</span>
          {event.rewardAmount !== undefined && (
            <>
              {" · "}
              <span className="font-bold text-primary">
                +{event.rewardAmount}
                {event.rewardType === "screen-time"
                  ? "m"
                  : event.rewardType === "cash"
                  ? "$"
                  : "pts"}
              </span>
            </>
          )}
          {event.quizScore !== undefined && (
            <> · scored {event.quizScore}</>
          )}
        </div>
        {event.rejectionReason && (
          <div className="text-[11px] text-danger mt-0.5">
            Reason: {event.rejectionReason}
          </div>
        )}
      </div>
      <div className="text-[11px] text-muted tabular-nums">{time}</div>
    </Card>
  );
}

function describeKind(kind: string) {
  switch (kind) {
    case "submitted":
      return {
        icon: <Send size={14} strokeWidth={2.4} />,
        color: "text-accent",
        bg: "bg-accent-soft",
        label: "submitted",
      };
    case "approved":
      return {
        icon: <Check size={14} strokeWidth={2.4} />,
        color: "text-primary",
        bg: "bg-primary-soft",
        label: "approved",
      };
    case "rejected":
      return {
        icon: <X size={14} strokeWidth={2.4} />,
        color: "text-danger",
        bg: "bg-danger-soft",
        label: "rejected",
      };
    case "reward_granted":
      return {
        icon: <Gift size={14} strokeWidth={2.4} />,
        color: "text-points",
        bg: "bg-points-soft",
        label: "earned reward from",
      };
    default:
      return {
        icon: <HelpCircle size={14} strokeWidth={2.4} />,
        color: "text-muted",
        bg: "bg-surface-alt",
        label: kind,
      };
  }
}

function groupByDay(events: Event[]): [string, Event[]][] {
  const map = new Map<string, Event[]>();
  for (const e of events) {
    const day = new Date(e.occurredAt).toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(e);
  }
  return Array.from(map.entries());
}

// Suppress "imported but unused" warnings for icons that future kinds might use
void Footprints;
void Camera;
