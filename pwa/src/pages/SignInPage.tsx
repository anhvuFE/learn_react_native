import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { firebaseAuth } from "../lib/firebase";

type Mode = "signin" | "signup";

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password required");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      }
    } catch (e) {
      setError((e as Error).message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setError("Enter your email above first");
      return;
    }
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setInfo("Password reset link sent — check your inbox");
      setError(null);
    } catch (e) {
      setError((e as Error).message.replace("Firebase: ", ""));
    }
  };

  return (
    <div className="h-full grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-accent grid place-items-center mb-3">
            <Shield size={26} color="white" strokeWidth={2.4} />
          </div>
          <h1 className="text-[26px] font-bold text-text tracking-tight">
            ScreenMindr
          </h1>
          <p className="text-[13px] text-muted mt-1">Parent dashboard</p>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm">
          {/* Tab toggle */}
          <div className="flex bg-surface-alt p-1 rounded-full mb-5">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setInfo(null);
                }}
                className={`flex-1 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                  mode === m
                    ? "bg-white text-text shadow-sm"
                    : "text-muted"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="parent@example.com"
            className="w-full bg-surface-alt border border-border rounded-xl px-4 py-2.5 text-[15px] mb-3 focus:border-accent"
          />

          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full bg-surface-alt border border-border rounded-xl px-4 py-2.5 text-[15px] mb-2 focus:border-accent"
          />

          {mode === "signin" && (
            <button
              onClick={forgot}
              type="button"
              className="text-[12px] text-accent font-medium mb-2"
            >
              Forgot password?
            </button>
          )}

          {error && (
            <div className="text-[12px] text-danger bg-danger-soft rounded-lg px-3 py-2 mt-2 mb-2">
              {error}
            </div>
          )}
          {info && (
            <div className="text-[12px] text-primary bg-primary-soft rounded-lg px-3 py-2 mt-2 mb-2">
              {info}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full mt-3 bg-text text-white rounded-xl py-2.5 font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </div>

        <p className="text-center text-[11px] text-muted mt-5">
          For parent accounts. Children pair via the mobile app.
        </p>
      </div>
    </div>
  );
}
