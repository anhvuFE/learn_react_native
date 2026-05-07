import { useMutation, useQuery } from "@apollo/client";
import {
  Camera,
  Footprints,
  HelpCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  Button,
  Card,
  Empty,
  Input,
  PageHeader,
  SectionLabel,
} from "../components/ui";
import { cn } from "../lib/cn";
import {
  CREATE_TASK,
  DELETE_TASK,
  MY_FAMILY_QUERY,
  TASKS_QUERY,
  UPDATE_TASK,
} from "../lib/queries";

type TaskType = "WALK" | "VIDEO_QUIZ" | "PHOTO";

interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
}

interface TaskRow {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  walkTargetSteps?: number;
  walkTargetSeconds?: number;
  videoTitle?: string;
  quizSecondsPerQuestion?: number;
  rewards: { screenTimeMin: number; points: number; cashUsd: number };
  quiz?: Quiz[];
  assignedToChildUid?: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  walk: <Footprints size={18} className="text-primary" strokeWidth={2.4} />,
  video_quiz: <HelpCircle size={18} className="text-accent" strokeWidth={2.4} />,
  photo: <Camera size={18} className="text-warning" strokeWidth={2.4} />,
};

const TYPE_LABELS: Record<string, string> = {
  walk: "Walk",
  video_quiz: "Video quiz",
  photo: "Photo",
};

const TYPE_BG: Record<string, string> = {
  walk: "bg-primary-soft",
  video_quiz: "bg-accent-soft",
  photo: "bg-points-soft",
};

export default function TasksPage() {
  const { data, loading } = useQuery<{ tasks: TaskRow[] }>(TASKS_QUERY);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [creating, setCreating] = useState(false);

  const tasks = data?.tasks ?? [];

  return (
    <div>
      <PageHeader
        title="Missions"
        subtitle="Custom tasks your kids complete to earn screen time"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={2.6} />
            Add mission
          </Button>
        }
      />

      {loading && tasks.length === 0 ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : tasks.length === 0 ? (
        <Empty
          icon={<Plus size={22} className="text-muted" />}
          title="No missions yet"
          subtitle="Create your first mission so kids can start earning"
          action={<Button onClick={() => setCreating(true)}>Add mission</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onEdit={() => setEditing(t)} />
          ))}
        </div>
      )}

      {(creating || editing) && (
        <TaskFormModal
          task={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function TaskCard({
  task,
  onEdit,
}: {
  task: TaskRow;
  onEdit: () => void;
}) {
  const [del] = useMutation(DELETE_TASK, {
    refetchQueries: [{ query: TASKS_QUERY }],
  });
  const onDelete = async () => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await del({ variables: { id: task.id } });
  };

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl grid place-items-center",
            TYPE_BG[task.type] ?? "bg-surface-alt",
          )}
        >
          {TYPE_ICONS[task.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-muted uppercase tracking-wider">
            {TYPE_LABELS[task.type] ?? task.type}
          </div>
          <div className="text-[15px] font-semibold text-text truncate">
            {task.title}
          </div>
        </div>
      </div>
      <div className="text-[13px] text-muted line-clamp-2 mb-3">
        {task.description}
      </div>
      <div className="flex items-center gap-3 text-[12px] mb-3 pt-3 border-t border-border">
        <Badge color="primary" label={`${task.rewards.screenTimeMin}m`} />
        <Badge color="points" label={`${task.rewards.points} pts`} />
        <Badge color="warning" label={`$${task.rewards.cashUsd.toFixed(2)}`} />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil size={13} />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 size={13} />
          Delete
        </Button>
      </div>
    </Card>
  );
}

function Badge({
  color,
  label,
}: {
  color: "primary" | "points" | "warning";
  label: string;
}) {
  const cls = {
    primary: "bg-primary-soft text-primary",
    points: "bg-points-soft text-points",
    warning: "bg-warning/10 text-warning",
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-md font-bold",
        cls[color],
      )}
    >
      {label}
    </span>
  );
}

function TaskFormModal({
  task,
  onClose,
}: {
  task: TaskRow | null;
  onClose: () => void;
}) {
  const isEdit = !!task;
  const { data: famData } = useQuery<{
    myFamily: { children: { uid: string; name?: string; email?: string }[] };
  }>(MY_FAMILY_QUERY);
  const children = famData?.myFamily?.children ?? [];

  const [type, setType] = useState<TaskType>(
    (task?.type?.toUpperCase() as TaskType) ?? "WALK",
  );
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [screenTimeMin, setScreenTimeMin] = useState(
    task?.rewards.screenTimeMin?.toString() ?? "20",
  );
  const [points, setPoints] = useState(task?.rewards.points?.toString() ?? "30");
  const [cashUsd, setCashUsd] = useState(
    task?.rewards.cashUsd?.toFixed(2) ?? "0.50",
  );
  const [walkSteps, setWalkSteps] = useState(
    task?.walkTargetSteps?.toString() ?? "20",
  );
  const [walkSeconds, setWalkSeconds] = useState(
    task?.walkTargetSeconds?.toString() ?? "60",
  );
  const [videoTitle, setVideoTitle] = useState(task?.videoTitle ?? "");
  const [quizSeconds, setQuizSeconds] = useState(
    task?.quizSecondsPerQuestion?.toString() ?? "60",
  );
  const [quiz, setQuiz] = useState<Quiz[]>(
    task?.quiz ?? [{ question: "", options: ["", "", "", ""], correctIndex: 0 }],
  );
  const [assignedTo, setAssignedTo] = useState(task?.assignedToChildUid ?? "");

  const [create, { loading: creating }] = useMutation(CREATE_TASK, {
    refetchQueries: [{ query: TASKS_QUERY }],
  });
  const [update, { loading: updating }] = useMutation(UPDATE_TASK, {
    refetchQueries: [{ query: TASKS_QUERY }],
  });

  const submit = async () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }
    const rewards = {
      screenTimeMin: parseInt(screenTimeMin, 10) || 0,
      points: parseInt(points, 10) || 0,
      cashUsd: parseFloat(cashUsd) || 0,
    };
    const baseInput: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      rewards,
      assignedToChildUid: assignedTo || undefined,
    };
    if (type === "WALK") {
      baseInput.walkTargetSteps = parseInt(walkSteps, 10) || 20;
      baseInput.walkTargetSeconds = parseInt(walkSeconds, 10) || 60;
    } else if (type === "VIDEO_QUIZ") {
      baseInput.videoTitle = videoTitle.trim() || undefined;
      baseInput.quizSecondsPerQuestion = parseInt(quizSeconds, 10) || 60;
      baseInput.quiz = quiz
        .filter((q) => q.question.trim() && q.options.every((o) => o.trim()))
        .map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()),
          correctIndex: q.correctIndex,
        }));
    }
    try {
      if (isEdit && task) {
        await update({ variables: { id: task.id, input: baseInput } });
      } else {
        await create({
          variables: { input: { ...baseInput, type } },
        });
      }
      onClose();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4">
      <div className="bg-surface rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-auto">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface">
          <h2 className="text-[18px] font-bold text-text tracking-tight">
            {isEdit ? "Edit mission" : "New mission"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted text-sm hover:text-text"
          >
            Cancel
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!isEdit && (
            <div>
              <SectionLabel>Type</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                {(["WALK", "VIDEO_QUIZ", "PHOTO"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-left transition-colors",
                      type === t
                        ? "border-text bg-surface-alt"
                        : "border-border hover:border-text/30",
                    )}
                  >
                    <div className="text-[14px] font-semibold text-text">
                      {TYPE_LABELS[t.toLowerCase()]}
                    </div>
                    <div className="text-[11px] text-muted mt-0.5">
                      {t === "WALK"
                        ? "Step counter"
                        : t === "VIDEO_QUIZ"
                        ? "Watch + answer"
                        : "Submit photo"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionLabel>Title</SectionLabel>
            <Input
              value={title}
              onChange={setTitle}
              placeholder="Walk Adventure"
            />
          </div>

          <div>
            <SectionLabel>Description</SectionLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should they do?"
              rows={2}
              className="w-full bg-surface-alt border border-border rounded-xl px-3.5 py-2 text-[14px] focus:border-accent resize-none"
            />
          </div>

          <div>
            <SectionLabel>Rewards</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              <Field
                label="Screen time (min)"
                value={screenTimeMin}
                onChange={setScreenTimeMin}
                type="number"
              />
              <Field
                label="Points"
                value={points}
                onChange={setPoints}
                type="number"
              />
              <Field
                label="Cash ($)"
                value={cashUsd}
                onChange={setCashUsd}
                type="number"
              />
            </div>
          </div>

          {type === "WALK" && (
            <div>
              <SectionLabel>Walk goal</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Steps"
                  value={walkSteps}
                  onChange={setWalkSteps}
                  type="number"
                />
                <Field
                  label="Seconds"
                  value={walkSeconds}
                  onChange={setWalkSeconds}
                  type="number"
                />
              </div>
            </div>
          )}

          {type === "VIDEO_QUIZ" && (
            <>
              <div>
                <SectionLabel>Video</SectionLabel>
                <Input
                  value={videoTitle}
                  onChange={setVideoTitle}
                  placeholder="Staying Safe Online (2:14)"
                />
              </div>
              <div>
                <SectionLabel>Per-question time (sec)</SectionLabel>
                <Input
                  value={quizSeconds}
                  onChange={setQuizSeconds}
                  type="number"
                />
              </div>
              <div>
                <SectionLabel>Questions</SectionLabel>
                {quiz.map((q, qi) => (
                  <div
                    key={qi}
                    className="border border-border rounded-xl p-3 mb-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[12px] font-bold text-muted uppercase tracking-wider">
                        Question {qi + 1}
                      </div>
                      {quiz.length > 1 && (
                        <button
                          onClick={() =>
                            setQuiz(quiz.filter((_, i) => i !== qi))
                          }
                          className="text-muted hover:text-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <Input
                      value={q.question}
                      onChange={(v) => {
                        const next = [...quiz];
                        next[qi] = { ...q, question: v };
                        setQuiz(next);
                      }}
                      placeholder="What was the speaker wearing?"
                    />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className="flex items-center gap-2 bg-surface-alt rounded-xl px-2"
                        >
                          <input
                            type="radio"
                            checked={q.correctIndex === oi}
                            onChange={() => {
                              const next = [...quiz];
                              next[qi] = { ...q, correctIndex: oi };
                              setQuiz(next);
                            }}
                            className="accent-primary"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const next = [...quiz];
                              const newOpts = [...q.options];
                              newOpts[oi] = e.target.value;
                              next[qi] = { ...q, options: newOpts };
                              setQuiz(next);
                            }}
                            placeholder={`Option ${oi + 1}`}
                            className="flex-1 bg-transparent border-0 outline-none py-2 text-[13px]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setQuiz([
                      ...quiz,
                      {
                        question: "",
                        options: ["", "", "", ""],
                        correctIndex: 0,
                      },
                    ])
                  }
                  className="text-[13px] text-accent font-semibold flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add question
                </button>
              </div>
            </>
          )}

          <div>
            <SectionLabel>Assign to (optional)</SectionLabel>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-surface-alt border border-border rounded-xl px-3.5 py-2 text-[14px] focus:border-accent"
            >
              <option value="">Anyone in family</option>
              {children.map((c) => (
                <option key={c.uid} value={c.uid}>
                  {c.name ?? c.email ?? c.uid}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-2 sticky bottom-0 bg-surface">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={creating || updating}>
            {creating || updating
              ? "Saving…"
              : isEdit
              ? "Save changes"
              : "Create mission"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
        {label}
      </div>
      <Input value={value} onChange={onChange} type={type} />
    </div>
  );
}
