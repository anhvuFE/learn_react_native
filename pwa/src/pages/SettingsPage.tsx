import { useMutation, useQuery } from "@apollo/client";
import { Bell, Camera, Languages, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getCurrentPermission,
  requestWebPushToken,
} from "../lib/messaging";
import { Settings as SettingsIcon } from "lucide-react";
import {
  Button,
  Card,
  Hero,
  Input,
  SectionLabel,
  Toggle,
} from "../components/ui";
import { useAuth } from "../lib/auth";
import {
  DELETE_MY_ACCOUNT,
  ME_QUERY,
  REQUEST_AVATAR_UPLOAD,
  SET_WEB_PUSH_TOKEN,
  UPDATE_MY_PROFILE,
  UPDATE_MY_SETTINGS,
} from "../lib/queries";

interface Me {
  uid: string;
  email?: string;
  name?: string;
  autoApproveQuiz?: boolean;
  autoApproveWalk?: boolean;
  requirePhotoApproval?: boolean;
  notifyOnSubmit?: boolean;
  autoLock?: boolean;
  bedtimeMode?: boolean;
  dailyScreenTimeCapMin?: number | null;
  photoDownloadUrl?: string;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data } = useQuery<{ me: Me }>(ME_QUERY);
  const me = data?.me;

  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);

  useEffect(() => {
    if (me?.name && name === "") setName(me.name);
  }, [me?.name, name]);

  const [updateProfile, { loading: savingProfile }] = useMutation(
    UPDATE_MY_PROFILE,
    { refetchQueries: [{ query: ME_QUERY }] },
  );
  const [updateSettings] = useMutation(UPDATE_MY_SETTINGS, {
    refetchQueries: [{ query: ME_QUERY }],
  });

  const saveProfile = async () => {
    try {
      await updateProfile({ variables: { input: { name: name.trim() } } });
      setSavedName(name.trim());
      setTimeout(() => setSavedName(null), 1500);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const setBool = (key: keyof Me, value: boolean) => {
    updateSettings({ variables: { input: { [key]: value } } }).catch(() => {});
  };

  return (
    <div>
      <div className="mb-3.5">
        <div className="text-[11px] font-semibold text-muted uppercase tracking-[0.6px]">
          PREFERENCES
        </div>
        <h1 className="text-[26px] font-bold text-text tracking-[-0.4px] mt-0.5">
          {t("settings.title")}
        </h1>
      </div>

      <Hero
        accent="indigo"
        icon={<SettingsIcon size={20} color="#fff" strokeWidth={2.2} />}
        label="Account"
        value={(me?.name ?? me?.email?.split("@")[0] ?? "—")
          .slice(0, 1)
          .toUpperCase()}
        subtitle={t("settings.subtitle")}
      />

      <SectionLabel>Profile</SectionLabel>
      <Card className="p-5 mb-6">
        <div className="flex gap-5 items-start">
          <AvatarPicker
            photoUrl={me?.photoDownloadUrl}
            initial={(me?.name ?? me?.email ?? "?")[0]?.toUpperCase() ?? "?"}
          />
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                Display name
              </div>
              <Input value={name} onChange={setName} placeholder="Your name" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                Email
              </div>
              <div className="bg-surface-alt border border-border rounded-xl px-3.5 py-2 text-[14px] text-muted">
                {me?.email ?? "—"}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end items-center gap-3">
          {savedName && (
            <span className="text-[12px] text-primary font-semibold">
              Saved
            </span>
          )}
          <Button onClick={saveProfile} disabled={savingProfile}>
            Save
          </Button>
        </div>
      </Card>

      <SectionLabel>Approval defaults</SectionLabel>
      <Card className="mb-6">
        <SettingRow
          title="Auto-approve quizzes"
          subtitle="Skip review for video quiz submissions if all answers correct"
          value={me?.autoApproveQuiz ?? true}
          onChange={(v) => setBool("autoApproveQuiz", v)}
        />
        <SettingRow
          title="Auto-approve walks"
          subtitle="Skip review for completed walk missions"
          value={me?.autoApproveWalk ?? true}
          onChange={(v) => setBool("autoApproveWalk", v)}
        />
        <SettingRow
          title="Require photo approval"
          subtitle="Always review photo submissions before granting reward"
          value={me?.requirePhotoApproval ?? true}
          onChange={(v) => setBool("requirePhotoApproval", v)}
        />
        <SettingRow
          title="Push when child submits"
          subtitle="Get a push notification when a new submission lands"
          value={me?.notifyOnSubmit ?? true}
          onChange={(v) => setBool("notifyOnSubmit", v)}
          last
        />
      </Card>

      <SectionLabel>Language</SectionLabel>
      <Card className="p-5 mb-6">
        <LanguageControl />
      </Card>

      <SectionLabel>Web push notifications</SectionLabel>
      <Card className="p-5 mb-6">
        <WebPushControl />
      </Card>

      <SectionLabel>Behavior</SectionLabel>
      <Card className="mb-6">
        <SettingRow
          title="Auto-lock when reward ends"
          subtitle="Lock apps when screen-time reward expires"
          value={me?.autoLock ?? true}
          onChange={(v) => setBool("autoLock", v)}
        />
        <SettingRow
          title="Bedtime mode"
          subtitle="Block screen-time rewards 9 PM – 7 AM"
          value={me?.bedtimeMode ?? false}
          onChange={(v) => setBool("bedtimeMode", v)}
          last
        />
      </Card>

      <SectionLabel>Daily screen-time cap</SectionLabel>
      <Card className="p-5 mb-6">
        <DailyCapControl me={me} />
      </Card>

      <SectionLabel>Danger zone</SectionLabel>
      <DangerZone />
    </div>
  );
}

function DangerZone() {
  const { signOut } = useAuth();
  const [deleteAccount, { loading }] = useMutation(DELETE_MY_ACCOUNT);
  const [confirming, setConfirming] = useState(false);
  const [text, setText] = useState("");

  const onDelete = async () => {
    if (text !== "DELETE") {
      alert('Type "DELETE" to confirm');
      return;
    }
    try {
      await deleteAccount();
      await signOut();
      window.location.href = "/signin";
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <Card className="p-5 border-danger/30 bg-danger/5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-danger-soft grid place-items-center">
          <Trash2 size={18} className="text-danger" strokeWidth={2.4} />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-text">
            Delete account
          </div>
          <div className="text-[12px] text-muted mt-0.5">
            Permanently removes your account, your family, all paired children,
            tasks, submissions, and rewards. This cannot be undone.
          </div>

          {confirming ? (
            <div className="mt-3 flex gap-2">
              <Input
                value={text}
                onChange={setText}
                placeholder='Type "DELETE" to confirm'
              />
              <Button
                variant="danger"
                onClick={onDelete}
                disabled={loading || text !== "DELETE"}
              >
                {loading ? "Deleting…" : "Confirm"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirming(false);
                  setText("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirming(true)}
              className="mt-3"
            >
              <Trash2 size={14} />
              Delete my account
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function AvatarPicker({
  photoUrl,
  initial,
}: {
  photoUrl?: string;
  initial: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [requestUpload] = useMutation<{ requestAvatarUpload: string }>(
    REQUEST_AVATAR_UPLOAD,
    { refetchQueries: [{ query: ME_QUERY }], awaitRefetchQueries: true },
  );

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const contentType = file.type || "image/jpeg";
      const r = await requestUpload({ variables: { contentType } });
      const url = r.data?.requestAvatarUpload;
      if (!url) throw new Error("No upload URL");
      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload failed: ${put.status}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-20 h-20 rounded-full bg-accent text-white grid place-items-center font-bold text-2xl overflow-hidden relative group"
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          initial
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
          <Camera size={20} className="text-white" />
        </div>
      </button>
      {uploading && (
        <div className="absolute inset-0 bg-black/60 rounded-full grid place-items-center">
          <span className="text-white text-[10px] font-bold">…</span>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

function DailyCapControl({ me }: { me?: Me }) {
  const [val, setVal] = useState<string>(
    me?.dailyScreenTimeCapMin?.toString() ?? "",
  );
  const [updateSettings, { loading }] = useMutation(UPDATE_MY_SETTINGS, {
    refetchQueries: [{ query: ME_QUERY }],
  });

  useEffect(() => {
    if (me?.dailyScreenTimeCapMin != null) {
      setVal(me.dailyScreenTimeCapMin.toString());
    } else if (me) {
      setVal("");
    }
  }, [me?.dailyScreenTimeCapMin, me]);

  const save = async () => {
    const minutes = val.trim() === "" ? null : parseInt(val, 10);
    if (minutes !== null && (isNaN(minutes) || minutes < 0)) {
      alert("Enter a valid number of minutes (or empty for no cap)");
      return;
    }
    await updateSettings({
      variables: { input: { dailyScreenTimeCapMin: minutes } },
    });
  };

  return (
    <div className="flex items-start gap-4">
      <div className="flex-1">
        <div className="text-[14px] font-semibold text-text">
          Maximum minutes per day
        </div>
        <div className="text-[12px] text-muted mt-0.5">
          Total screen-time rewards a child can earn in one calendar day. Leave
          empty for no cap.
        </div>
        <div className="flex gap-2 mt-3 max-w-xs">
          <Input
            value={val}
            onChange={setVal}
            type="number"
            placeholder="No cap"
          />
          <Button onClick={save} disabled={loading}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function LanguageControl() {
  const { i18n, t } = useTranslation();
  const langs = [
    { code: "en", label: "English" },
    { code: "vi", label: "Tiếng Việt" },
  ];
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-surface-alt grid place-items-center">
        <Languages size={18} className="text-text" strokeWidth={2.4} />
      </div>
      <div className="flex-1">
        <div className="text-[14px] font-semibold text-text">
          {t("settings.language")}
        </div>
        <div className="text-[12px] text-muted mt-0.5">
          {t("settings.languageHint")}
        </div>
        <div className="mt-3 flex gap-2">
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => i18n.changeLanguage(l.code)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${
                i18n.resolvedLanguage === l.code
                  ? "bg-text text-white"
                  : "bg-surface border border-border text-muted hover:border-text/30"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function WebPushControl() {
  const [perm, setPerm] = useState<NotificationPermission | null>(
    getCurrentPermission(),
  );
  const [busy, setBusy] = useState(false);
  const [setToken] = useMutation(SET_WEB_PUSH_TOKEN);

  const enable = async () => {
    setBusy(true);
    try {
      const token = await requestWebPushToken();
      setPerm(getCurrentPermission());
      if (!token) {
        alert(
          "Could not register web push. Make sure VITE_FIREBASE_VAPID_KEY is set in pwa/.env (generate from Firebase Console → Cloud Messaging → Web Push certificates).",
        );
        return;
      }
      await setToken({ variables: { token } });
      alert("Web push enabled. You'll get a notification when kids submit.");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      await setToken({ variables: { token: null } });
      alert("Web push disabled on the server. Browser permission is unchanged.");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const isGranted = perm === "granted";
  const isDenied = perm === "denied";

  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-accent-soft grid place-items-center">
        <Bell size={18} className="text-accent" strokeWidth={2.4} />
      </div>
      <div className="flex-1">
        <div className="text-[14px] font-semibold text-text">
          Browser notifications
        </div>
        <div className="text-[12px] text-muted mt-0.5">
          {isGranted
            ? "Granted — you'll receive a notification when a child submits a mission, even when this tab is closed."
            : isDenied
            ? "Blocked. Update site permissions in your browser to re-enable."
            : "Not enabled. Allow notifications to get pushed when kids submit."}
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={enable} disabled={busy || isDenied} size="sm">
            {isGranted ? "Re-register" : "Enable notifications"}
          </Button>
          {isGranted && (
            <Button variant="ghost" size="sm" onClick={disable} disabled={busy}>
              Disable
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  subtitle,
  value,
  onChange,
  last,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      className={`px-5 py-4 flex items-center gap-4 ${
        last ? "" : "border-b border-border"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-text">{title}</div>
        <div className="text-[12px] text-muted mt-0.5">{subtitle}</div>
      </div>
      <Toggle checked={value} onChange={onChange} />
    </div>
  );
}
