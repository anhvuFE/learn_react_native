import { useMutation, useQuery } from "@apollo/client";
import { ChevronLeft, Sparkles, Timer, Wallet, X } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import {
  Button,
  Card,
  Empty,
  Hero,
  SectionLabel,
} from "../components/ui";
import {
  CANCEL_REWARD,
  CHILD_BANK_QUERY,
  CHILD_REWARDS_QUERY,
  MY_FAMILY_QUERY,
} from "../lib/queries";

interface Reward {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  expiresAt?: string;
}

export default function ChildDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const nav = useNavigate();

  const { data: famData } = useQuery<{
    myFamily: { children: { uid: string; name?: string; email?: string }[] };
  }>(MY_FAMILY_QUERY);
  const child = famData?.myFamily?.children.find((c) => c.uid === uid);
  const name = child?.name ?? child?.email?.split("@")[0] ?? "Child";

  const { data: bankData } = useQuery<{
    childBank: {
      points: number;
      cashUsd: number;
      screenTimeMinutesRemaining: number;
      activeReward: {
        id: string;
        type: string;
        amount: number;
        expiresAt: string;
      } | null;
    };
  }>(CHILD_BANK_QUERY, {
    variables: { childUid: uid },
    skip: !uid,
    pollInterval: 30000,
  });

  const { data: rewardsData } = useQuery<{ childRewards: Reward[] }>(
    CHILD_REWARDS_QUERY,
    { variables: { childUid: uid }, skip: !uid },
  );

  const [cancelReward, { loading: cancelling }] = useMutation(CANCEL_REWARD, {
    refetchQueries: [
      { query: CHILD_BANK_QUERY, variables: { childUid: uid } },
      { query: CHILD_REWARDS_QUERY, variables: { childUid: uid } },
    ],
  });

  const bank = bankData?.childBank;
  const rewards = rewardsData?.childRewards ?? [];
  const active = bank?.activeReward;
  const isUnlocked = active && new Date(active.expiresAt).getTime() > Date.now();

  return (
    <div>
      <button
        onClick={() => nav("/children")}
        className="flex items-center gap-1 text-[13px] text-muted hover:text-text mb-3"
      >
        <ChevronLeft size={16} />
        Back to children
      </button>

      <div className="mb-3.5">
        <div className="text-[11px] font-semibold text-muted uppercase tracking-[0.6px]">
          CHILD PROFILE
        </div>
        <h1 className="text-[26px] font-bold text-text tracking-[-0.4px] mt-0.5">
          {name}
        </h1>
      </div>

      <Hero
        accent={isUnlocked ? "green" : "indigo"}
        icon={<Timer size={20} color="#fff" strokeWidth={2.2} />}
        label={isUnlocked ? "Apps unlocked" : "Apps locked"}
        value={`${bank?.screenTimeMinutesRemaining ?? 0}`}
        valueSuffix="min"
        subtitle={
          isUnlocked
            ? "Auto-locks when timer hits 0"
            : "Earned screen time will appear here"
        }
        chips={[
          {
            icon: <Sparkles size={11} color="rgba(255,255,255,0.85)" strokeWidth={2.4} />,
            label: "Points",
            value: `${bank?.points ?? 0}`,
          },
          {
            icon: <Wallet size={11} color="rgba(255,255,255,0.85)" strokeWidth={2.4} />,
            label: "Cash",
            value: `$${(bank?.cashUsd ?? 0).toFixed(2)}`,
          },
        ]}
      />


      {isUnlocked && active && (
        <Card className="mb-6 px-5 py-4 bg-primary text-white border-primary">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Active reward
              </div>
              <div className="text-[16px] font-bold mt-1">
                {active.amount} min unlocked · expires{" "}
                {new Date(active.expiresAt).toLocaleTimeString()}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                confirm("Cancel active reward?") &&
                cancelReward({ variables: { id: active.id } })
              }
              disabled={cancelling}
              className="!bg-white/10 !text-white !border-white/30"
            >
              <X size={14} />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <SectionLabel>Reward history</SectionLabel>
      {rewards.length === 0 ? (
        <Empty title="No rewards yet" subtitle="History will appear here once approved" />
      ) : (
        <div className="space-y-2">
          {rewards.map((r) => (
            <Card key={r.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-alt grid place-items-center">
                {r.type === "screen_time" ? (
                  <Timer size={16} className="text-screentime" strokeWidth={2.4} />
                ) : r.type === "points" ? (
                  <Sparkles size={16} className="text-points" strokeWidth={2.4} />
                ) : (
                  <Wallet size={16} className="text-warning" strokeWidth={2.4} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-text">
                  +{r.amount}{" "}
                  {r.type === "screen_time"
                    ? "min screen time"
                    : r.type === "points"
                    ? "points"
                    : `$${r.amount}`}
                </div>
                <div className="text-[11px] text-muted">
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                  r.status === "active"
                    ? "bg-primary-soft text-primary"
                    : r.status === "consumed"
                    ? "bg-surface-alt text-muted"
                    : "bg-danger-soft text-danger"
                }`}
              >
                {r.status}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
