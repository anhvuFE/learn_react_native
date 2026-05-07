import { useMutation, useQuery } from "@apollo/client";
import { Check, Gift, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Button,
  Card,
  Empty,
  Input,
  PageHeader,
  SectionLabel,
  Toggle,
} from "../components/ui";
import {
  CREATE_REWARD_ITEM,
  DELETE_REWARD_ITEM,
  FULFILL_REDEMPTION,
  MY_FAMILY_QUERY,
  REDEMPTIONS_QUERY,
  REWARD_ITEMS_QUERY,
  UPDATE_REWARD_ITEM,
} from "../lib/queries";

interface Item {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  costPoints: number;
  stock: number;
  active: boolean;
}

interface Redemption {
  id: string;
  itemName: string;
  costPoints: number;
  childUid: string;
  status: string;
  redeemedAt: string;
}

export default function ShopPage() {
  const { data } = useQuery<{ rewardItems: Item[] }>(REWARD_ITEMS_QUERY);
  const items = data?.rewardItems ?? [];
  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHeader
        title="Reward shop"
        subtitle="Items kids can spend their points on"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} />
            Add item
          </Button>
        }
      />

      {items.length === 0 ? (
        <Empty
          icon={<Gift size={22} className="text-muted" />}
          title="Shop is empty"
          subtitle="Create reward items kids can buy with points (e.g. extra screen time, ice cream, movie night)"
          action={<Button onClick={() => setCreating(true)}>Add item</Button>}
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {items.map((it) => (
            <ItemCard key={it.id} item={it} onEdit={() => setEditing(it)} />
          ))}
        </div>
      )}

      <SectionLabel>Pending redemptions</SectionLabel>
      <RedemptionsList />

      {(creating || editing) && (
        <ItemFormModal
          item={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ItemCard({ item, onEdit }: { item: Item; onEdit: () => void }) {
  const [del] = useMutation(DELETE_REWARD_ITEM, {
    refetchQueries: [{ query: REWARD_ITEMS_QUERY }],
  });
  const [update] = useMutation(UPDATE_REWARD_ITEM, {
    refetchQueries: [{ query: REWARD_ITEMS_QUERY }],
  });

  return (
    <Card className={`p-5 ${!item.active ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-points-soft grid place-items-center text-2xl">
          {item.emoji ?? "🎁"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-text">{item.name}</div>
          <div className="text-[12px] text-muted line-clamp-2">
            {item.description}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3 pt-3 border-t border-border">
        <span className="px-2 py-0.5 rounded-md bg-points-soft text-points text-[12px] font-bold flex items-center gap-1">
          <Sparkles size={12} strokeWidth={2.4} />
          {item.costPoints} pts
        </span>
        <span className="text-[11px] text-muted">
          {item.stock < 0 ? "Unlimited" : `${item.stock} left`}
        </span>
        <div className="ml-auto">
          <Toggle
            checked={item.active}
            onChange={(v) =>
              update({ variables: { id: item.id, input: { active: v } } })
            }
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil size={13} />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            confirm(`Delete "${item.name}"?`) &&
            del({ variables: { id: item.id } })
          }
        >
          <Trash2 size={13} />
          Delete
        </Button>
      </div>
    </Card>
  );
}

function RedemptionsList() {
  const { data } = useQuery<{ redemptions: Redemption[] }>(REDEMPTIONS_QUERY, {
    pollInterval: 30000,
  });
  const { data: famData } = useQuery<{
    myFamily: { children: { uid: string; name?: string; email?: string }[] };
  }>(MY_FAMILY_QUERY);
  const children = famData?.myFamily?.children ?? [];
  const [fulfill] = useMutation(FULFILL_REDEMPTION, {
    refetchQueries: [{ query: REDEMPTIONS_QUERY }],
  });

  const all = data?.redemptions ?? [];
  const pending = all.filter((r) => r.status === "pending");
  const recent = all.filter((r) => r.status === "fulfilled").slice(0, 8);

  if (all.length === 0) {
    return (
      <Empty
        title="No redemptions yet"
        subtitle="Once kids buy items, they'll show up here for you to fulfill"
      />
    );
  }

  return (
    <div className="space-y-2 mb-8">
      {pending.map((r) => {
        const child =
          children.find((c) => c.uid === r.childUid)?.name ??
          r.childUid.slice(0, 6);
        return (
          <Card key={r.id} className="px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 grid place-items-center">
              <Gift size={16} className="text-warning" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-text">
                <span className="font-bold">{child}</span> redeemed{" "}
                <span className="font-semibold">{r.itemName}</span>
              </div>
              <div className="text-[11px] text-muted">
                {r.costPoints} points ·{" "}
                {new Date(r.redeemedAt).toLocaleString()}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => fulfill({ variables: { id: r.id } })}
            >
              <Check size={13} strokeWidth={2.6} />
              Mark fulfilled
            </Button>
          </Card>
        );
      })}
      {recent.length > 0 && (
        <>
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mt-4 mb-1">
            Recently fulfilled
          </div>
          {recent.map((r) => {
            const child =
              children.find((c) => c.uid === r.childUid)?.name ??
              r.childUid.slice(0, 6);
            return (
              <Card key={r.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-soft grid place-items-center">
                  <Check
                    size={16}
                    className="text-primary"
                    strokeWidth={2.4}
                  />
                </div>
                <div className="flex-1 min-w-0 text-[13px]">
                  <span className="font-bold text-text">{child}</span>
                  <span className="text-muted"> · {r.itemName}</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-primary tracking-wider">
                  Done
                </span>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

function ItemFormModal({
  item,
  onClose,
}: {
  item: Item | null;
  onClose: () => void;
}) {
  const isEdit = !!item;
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [emoji, setEmoji] = useState(item?.emoji ?? "🎁");
  const [costPoints, setCostPoints] = useState(
    item?.costPoints?.toString() ?? "50",
  );
  const [stock, setStock] = useState(item?.stock?.toString() ?? "-1");

  const [create, { loading: creating }] = useMutation(CREATE_REWARD_ITEM, {
    refetchQueries: [{ query: REWARD_ITEMS_QUERY }],
  });
  const [update, { loading: updating }] = useMutation(UPDATE_REWARD_ITEM, {
    refetchQueries: [{ query: REWARD_ITEMS_QUERY }],
  });

  const submit = async () => {
    if (!name.trim()) {
      alert("Name required");
      return;
    }
    const input = {
      name: name.trim(),
      description: description.trim() || undefined,
      emoji: emoji.trim() || undefined,
      costPoints: parseInt(costPoints, 10) || 0,
      stock: parseInt(stock, 10),
    };
    try {
      if (isEdit && item) {
        await update({ variables: { id: item.id, input } });
      } else {
        await create({ variables: { input } });
      }
      onClose();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4">
      <div className="bg-surface rounded-3xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-text">
            {isEdit ? "Edit item" : "New item"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted text-sm hover:text-text"
          >
            Cancel
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <div className="w-20">
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                Emoji
              </div>
              <Input value={emoji} onChange={setEmoji} placeholder="🎁" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                Name
              </div>
              <Input
                value={name}
                onChange={setName}
                placeholder="Ice cream day"
              />
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
              Description
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional details"
              className="w-full bg-surface-alt border border-border rounded-xl px-3.5 py-2 text-[14px] focus:border-accent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                Cost (points)
              </div>
              <Input
                value={costPoints}
                onChange={setCostPoints}
                type="number"
              />
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                Stock (-1 = unlimited)
              </div>
              <Input value={stock} onChange={setStock} type="number" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={creating || updating}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
