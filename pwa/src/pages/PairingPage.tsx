import { useMutation, useQuery } from "@apollo/client";
import { Copy, KeyRound, Plus } from "lucide-react";
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
  CREATE_PAIRING_CODE,
  MY_PAIRING_CODES,
} from "../lib/queries";

interface Code {
  code: string;
  expiresAt: string;
  childName?: string;
}

export default function PairingPage() {
  const { data, refetch } = useQuery<{ myPairingCodes: Code[] }>(
    MY_PAIRING_CODES,
  );
  const codes = data?.myPairingCodes ?? [];

  const [childName, setChildName] = useState("");
  const [generate, { loading }] = useMutation(CREATE_PAIRING_CODE);

  const onGenerate = async () => {
    if (!childName.trim()) {
      alert("Enter a name for the child");
      return;
    }
    try {
      await generate({ variables: { childName: childName.trim() } });
      setChildName("");
      refetch();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div>
      <div className="mb-3.5">
        <div className="text-[11px] font-semibold text-muted uppercase tracking-[0.6px]">
          DEVICE SETUP
        </div>
        <h1 className="text-[26px] font-bold text-text tracking-[-0.4px] mt-0.5">
          Pair a device
        </h1>
      </div>

      <Hero
        accent="indigo"
        icon={<KeyRound size={20} color="#fff" strokeWidth={2.2} />}
        label="Active codes"
        value={`${codes.length}`}
        valueSuffix={codes.length === 1 ? "code" : "codes"}
        subtitle="Generate a 6-character code, then enter it on your child's phone"
      />

      <Card className="p-5 mb-6">
        <SectionLabel>New pairing code</SectionLabel>
        <div className="flex gap-2">
          <Input
            value={childName}
            onChange={setChildName}
            placeholder="Child's name (e.g. Alex)"
          />
          <Button onClick={onGenerate} disabled={loading}>
            <Plus size={16} />
            Generate
          </Button>
        </div>
        <p className="text-[12px] text-muted mt-3">
          On your child's iPhone: open ScreenMindr → tap "Pair with parent" →
          enter the code below
        </p>
      </Card>

      <SectionLabel>Active codes</SectionLabel>
      {codes.length === 0 ? (
        <Empty
          icon={<KeyRound size={22} className="text-muted" />}
          title="No active codes"
          subtitle="Codes expire after a short time — generate one above"
        />
      ) : (
        <div className="space-y-2">
          {codes.map((c) => (
            <CodeRow key={c.code} code={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CodeRow({ code }: { code: Code }) {
  const [copied, setCopied] = useState(false);
  const expiresIn = Math.max(
    0,
    Math.round((new Date(code.expiresAt).getTime() - Date.now()) / 60000),
  );
  const onCopy = async () => {
    await navigator.clipboard.writeText(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Card className="px-5 py-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-accent-soft grid place-items-center">
        <KeyRound size={18} className="text-accent" strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold text-muted uppercase tracking-wider">
          {code.childName ?? "Unnamed"}
        </div>
        <div className="text-[24px] font-bold text-text tracking-tight tabular-nums">
          {code.code}
        </div>
        <div className="text-[11px] text-muted">
          Expires in {expiresIn} min
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onCopy}>
        <Copy size={14} />
        {copied ? "Copied" : "Copy"}
      </Button>
    </Card>
  );
}
