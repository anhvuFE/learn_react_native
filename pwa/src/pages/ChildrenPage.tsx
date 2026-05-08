import { useQuery } from "@apollo/client";
import { ChevronRight, Lock, Sparkles, Timer } from "lucide-react";
import { useNavigate } from "react-router";
import { Card, Empty, Hero } from "../components/ui";
import { Users } from "lucide-react";
import { CHILD_BANK_QUERY, MY_FAMILY_QUERY } from "../lib/queries";

export default function ChildrenPage() {
  const nav = useNavigate();
  const { data } = useQuery<{
    myFamily: {
      children: { uid: string; name?: string; email?: string; role: string }[];
    };
  }>(MY_FAMILY_QUERY);

  const children = data?.myFamily?.children ?? [];

  return (
    <div>
      <div className="mb-3.5">
        <div className="text-[11px] font-semibold text-muted uppercase tracking-[0.6px]">
          FAMILY MEMBERS
        </div>
        <h1 className="text-[26px] font-bold text-text tracking-[-0.4px] mt-0.5">
          Children
        </h1>
      </div>

      <Hero
        accent="indigo"
        icon={<Users size={20} color="#fff" strokeWidth={2.2} />}
        label="Your family"
        value={`${children.length}`}
        valueSuffix={children.length === 1 ? "kid" : "kids"}
        subtitle={
          children.length === 0
            ? "Pair the first device from the Pairing tab"
            : "Tap a child to see their bank balances and history"
        }
      />

      {children.length === 0 ? (
        <Empty
          title="No children paired"
          subtitle="Generate a pairing code from the Pairing tab"
        />
      ) : (
        <div className="space-y-3">
          {children.map((c) => (
            <ChildRow
              key={c.uid}
              uid={c.uid}
              name={c.name ?? c.email?.split("@")[0] ?? "Child"}
              email={c.email}
              onClick={() => nav(`/children/${c.uid}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChildRow({
  uid,
  name,
  email,
  onClick,
}: {
  uid: string;
  name: string;
  email?: string;
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
    <Card onClick={onClick} className="px-5 py-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-accent text-white grid place-items-center font-bold">
        {name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-text">{name}</div>
        <div className="text-[12px] text-muted">
          {email ?? `uid: ${uid.slice(0, 14)}…`}
        </div>
      </div>
      <div className="hidden md:flex items-center gap-5 mr-4">
        <Stat icon={<Timer size={13} />} value={`${bank?.screenTimeMinutesRemaining ?? 0}m`} />
        <Stat icon={<Sparkles size={13} />} value={`${bank?.points ?? 0}`} />
      </div>
      <div
        className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider mr-2 ${
          isUnlocked
            ? "bg-primary-soft text-primary"
            : "bg-surface-alt text-muted"
        }`}
      >
        {isUnlocked ? (
          <span className="flex items-center gap-1">
            <Sparkles size={10} />
            Unlocked
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Lock size={10} />
            Locked
          </span>
        )}
      </div>
      <ChevronRight size={16} className="text-muted" />
    </Card>
  );
}

function Stat({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1 text-text">
      <span className="text-muted">{icon}</span>
      <span className="text-[14px] font-bold tabular-nums">{value}</span>
    </div>
  );
}
