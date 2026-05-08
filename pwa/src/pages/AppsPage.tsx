import { useMutation, useQuery } from "@apollo/client";
import { Lock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Button,
  Card,
  Empty,
  Hero,
  Input,
  SectionLabel,
} from "../components/ui";
import {
  ADD_RESTRICTED_APP,
  REMOVE_RESTRICTED_APP,
  RESTRICTED_APPS_QUERY,
} from "../lib/queries";

interface App {
  id: string;
  appId: string;
  name: string;
  packageName?: string | null;
}

export default function AppsPage() {
  const { data } = useQuery<{ restrictedApps: App[] }>(RESTRICTED_APPS_QUERY);
  const apps = data?.restrictedApps ?? [];

  const [appId, setAppId] = useState("");
  const [name, setName] = useState("");
  const [pkg, setPkg] = useState("");

  const [add, { loading: adding }] = useMutation(ADD_RESTRICTED_APP, {
    refetchQueries: [{ query: RESTRICTED_APPS_QUERY }],
  });
  const [remove] = useMutation(REMOVE_RESTRICTED_APP, {
    refetchQueries: [{ query: RESTRICTED_APPS_QUERY }],
  });

  const submit = async () => {
    if (!appId.trim() || !name.trim()) {
      alert("App ID and Name required");
      return;
    }
    try {
      await add({
        variables: {
          input: {
            appId: appId.trim().toLowerCase(),
            name: name.trim(),
            packageName: pkg.trim() || undefined,
          },
        },
      });
      setAppId("");
      setName("");
      setPkg("");
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div>
      <div className="mb-3.5">
        <div className="text-[11px] font-semibold text-muted uppercase tracking-[0.6px]">
          ENFORCEMENT
        </div>
        <h1 className="text-[26px] font-bold text-text tracking-[-0.4px] mt-0.5">
          Restricted apps
        </h1>
      </div>

      <Hero
        accent="indigo"
        icon={<Lock size={20} color="#fff" strokeWidth={2.2} />}
        label="Locked apps"
        value={`${apps.length}`}
        valueSuffix={apps.length === 1 ? "app" : "apps"}
        subtitle="Kids must earn screen time before they can unlock these"
      />

      <Card className="p-5 mb-6">
        <SectionLabel>Add new app</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          <Input
            value={appId}
            onChange={setAppId}
            placeholder="App ID (tiktok)"
          />
          <Input value={name} onChange={setName} placeholder="Display name" />
          <Input
            value={pkg}
            onChange={setPkg}
            placeholder="Package (optional)"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={submit} disabled={adding}>
            <Plus size={16} />
            Add
          </Button>
        </div>
      </Card>

      {apps.length === 0 ? (
        <Empty
          icon={<Lock size={22} className="text-muted" />}
          title="No apps restricted"
        />
      ) : (
        <div className="space-y-2">
          {apps.map((a) => (
            <Card key={a.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-alt grid place-items-center">
                <Lock size={16} className="text-text" strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-text">
                  {a.name}
                </div>
                <div className="text-[11px] text-muted">
                  {a.appId}
                  {a.packageName ? ` · ${a.packageName}` : ""}
                </div>
              </div>
              <button
                onClick={() =>
                  confirm(`Remove ${a.name}?`) &&
                  remove({ variables: { id: a.id } })
                }
                className="w-8 h-8 rounded-lg hover:bg-danger-soft hover:text-danger grid place-items-center text-muted"
              >
                <Trash2 size={15} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
