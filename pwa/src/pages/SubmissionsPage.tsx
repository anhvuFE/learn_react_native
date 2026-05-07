import { useMutation, useQuery } from "@apollo/client";
import {
  Camera,
  Check,
  CheckCircle2,
  Footprints,
  HelpCircle,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button, Card, Empty, Input, PageHeader } from "../components/ui";
import { cn } from "../lib/cn";
import {
  APPROVE_SUBMISSION,
  PENDING_SUBMISSIONS,
  REJECT_SUBMISSION,
  TASKS_QUERY,
} from "../lib/queries";

interface Sub {
  id: string;
  taskId: string;
  childUid: string;
  familyId?: string;
  chosenReward: string;
  status: string;
  submittedAt: string;
  timerSeconds?: number;
  quizScore?: number;
  photoStoragePath?: string;
  photoDownloadUrl?: string;
}

export default function SubmissionsPage() {
  const { data, loading, refetch } = useQuery<{
    pendingSubmissions: Sub[];
  }>(PENDING_SUBMISSIONS, { pollInterval: 30000 });
  const { data: tasksData } = useQuery<{
    tasks: { id: string; title: string; type: string }[];
  }>(TASKS_QUERY);

  const subs = data?.pendingSubmissions ?? [];
  const taskMap = new Map(
    (tasksData?.tasks ?? []).map((t) => [t.id, t]),
  );

  return (
    <div>
      <PageHeader
        title="Submissions"
        subtitle={`${subs.length} waiting for your review`}
      />

      {loading && subs.length === 0 ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : subs.length === 0 ? (
        <Empty
          icon={<CheckCircle2 size={22} className="text-primary" />}
          title="All caught up"
          subtitle="No submissions waiting for review right now"
        />
      ) : (
        <div className="space-y-3">
          {subs.map((s) => (
            <SubmissionRow
              key={s.id}
              sub={s}
              taskTitle={taskMap.get(s.taskId)?.title}
              taskType={taskMap.get(s.taskId)?.type}
              onAction={() => refetch()}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  walk: <Footprints size={14} className="text-primary" strokeWidth={2.4} />,
  video_quiz: (
    <HelpCircle size={14} className="text-accent" strokeWidth={2.4} />
  ),
  photo: <Camera size={14} className="text-warning" strokeWidth={2.4} />,
};

function SubmissionRow({
  sub,
  taskTitle,
  taskType,
  onAction,
}: {
  sub: Sub;
  taskTitle?: string;
  taskType?: string;
  onAction: () => void;
}) {
  const [approve, { loading: approving }] = useMutation(APPROVE_SUBMISSION);
  const [reject, { loading: rejecting }] = useMutation(REJECT_SUBMISSION);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const handleApprove = async () => {
    await approve({ variables: { id: sub.id } });
    onAction();
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Reason required");
      return;
    }
    await reject({
      variables: { input: { id: sub.id, reason: rejectReason.trim() } },
    });
    setShowReject(false);
    setRejectReason("");
    onAction();
  };

  const ago = timeAgo(sub.submittedAt);

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        {/* Photo preview */}
        <div className="w-24 h-24 rounded-xl bg-surface-alt overflow-hidden grid place-items-center shrink-0">
          {sub.photoDownloadUrl ? (
            <img
              src={sub.photoDownloadUrl}
              alt="submission"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setPhotoOpen(true)}
            />
          ) : (
            <ImageIcon size={26} className="text-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {taskType && TYPE_ICON[taskType]}
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              {taskType?.replace("_", " ") ?? "Task"}
            </span>
            <span className="text-[10px] text-muted">·</span>
            <span className="text-[11px] text-muted">{ago}</span>
          </div>
          <div className="text-[15px] font-semibold text-text">
            {taskTitle ?? "Mission"}
          </div>
          <div className="text-[12px] text-muted mt-1">
            By {sub.childUid.slice(0, 10)}…
            {sub.timerSeconds &&
              ` · walked ${Math.round(sub.timerSeconds)}s`}
            {sub.quizScore !== undefined && ` · scored ${sub.quizScore}`}
          </div>
          <div className="text-[12px] text-text mt-1.5">
            Wants:{" "}
            <span className="font-bold">
              {sub.chosenReward.replace("_", " ")}
            </span>
          </div>

          {showReject ? (
            <div className="flex gap-2 mt-3">
              <Input
                value={rejectReason}
                onChange={setRejectReason}
                placeholder="Reason (e.g. not clear enough)"
              />
              <Button
                variant="danger"
                size="sm"
                onClick={handleReject}
                disabled={rejecting}
              >
                Reject
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReject(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 mt-3">
              <Button onClick={handleApprove} disabled={approving} size="sm">
                <Check size={14} strokeWidth={2.6} />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReject(true)}
              >
                <X size={14} strokeWidth={2.6} />
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      {photoOpen && sub.photoDownloadUrl && (
        <div
          onClick={() => setPhotoOpen(false)}
          className="fixed inset-0 bg-black/80 grid place-items-center z-50 p-6"
        >
          <img
            src={sub.photoDownloadUrl}
            alt="submission"
            className="max-w-full max-h-full rounded-2xl"
          />
        </div>
      )}
    </Card>
  );
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Make cn used to silence linter — actually used elsewhere
void cn;
