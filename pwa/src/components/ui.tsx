import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <div className="text-[11px] font-semibold text-muted uppercase tracking-[0.6px]">
          {subtitle ? "" : "Overview"}
        </div>
        <h1 className="text-[26px] font-bold text-text tracking-tight mt-0.5">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-muted mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * iOS-style hero card — colored gradient bg with optional pulse icon, big tabular value, sub, and chips.
 */
export function Hero({
  accent = "indigo",
  icon,
  label,
  value,
  valueSuffix,
  subtitle,
  chips,
}: {
  accent?: "indigo" | "orange" | "green" | "red";
  icon?: ReactNode;
  label: string;
  value: string;
  valueSuffix?: string;
  subtitle?: string;
  chips?: { icon: ReactNode; label: string; value: string }[];
}) {
  const palette = {
    indigo: { base: "#5856D6", overlay: "#5E5CE6", orb: "#FFD60A" },
    orange: { base: "#FF9500", overlay: "#FF6B00", orb: "#FFD60A" },
    green: { base: "#34C759", overlay: "#30D158", orb: "#FFFFFF" },
    red: { base: "#FF3B30", overlay: "#FF6B5B", orb: "#FFFFFF" },
  }[accent];

  return (
    <div
      className="relative rounded-[22px] overflow-hidden p-6 mb-5"
      style={{ background: palette.base }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: palette.overlay, opacity: 0.4 }}
      />
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: -50,
          right: -40,
          width: 180,
          height: 180,
          background: palette.orb,
          opacity: 0.18,
        }}
      />
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          bottom: -70,
          left: -20,
          width: 140,
          height: 140,
          background: "#FFFFFF",
          opacity: 0.1,
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-2.5 mb-4">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-white/20 grid place-items-center">
              {icon}
            </div>
          )}
          <span className="text-[11px] font-bold text-white/80 uppercase tracking-[0.8px]">
            {label}
          </span>
        </div>

        <div
          className="text-white font-extrabold tabular-nums"
          style={{
            fontSize: 56,
            letterSpacing: -1.8,
            lineHeight: 1.05,
          }}
        >
          {value}
          {valueSuffix && (
            <span className="text-[22px] font-semibold text-white/70 ml-1 tracking-[-0.4px]">
              {valueSuffix}
            </span>
          )}
        </div>
        {subtitle && (
          <div className="text-white/85 text-[14px] mt-1 tracking-[-0.1px]">
            {subtitle}
          </div>
        )}

        {chips && chips.length > 0 && (
          <div className="flex gap-2.5 mt-5">
            {chips.map((c, i) => (
              <div
                key={i}
                className="flex-1 bg-white/16 rounded-2xl px-3 py-2.5"
              >
                <div className="flex items-center gap-1 text-white/70">
                  <span className="opacity-90">{c.icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.4px]">
                    {c.label}
                  </span>
                </div>
                <div className="text-white text-[18px] font-bold tracking-[-0.3px] mt-0.5 tabular-nums">
                  {c.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * iOS-style grouped white card. Wrap rows and divide them with <Sep />.
 */
export function GroupedCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-surface rounded-[14px] overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * 0.5px separator with iOS-style 56px indent (chừa cho icon box).
 */
export function Sep() {
  return (
    <div
      style={{
        height: 0.5,
        background: "rgba(60,60,67,0.18)",
        marginLeft: 56,
      }}
    />
  );
}

/**
 * iOS Settings list row — icon accent box + label + optional value + chevron.
 */
export function SettingsRow({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  subtitle,
  destructive,
  onPress,
}: {
  icon: ReactNode;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string;
  subtitle?: string;
  destructive?: boolean;
  onPress?: () => void;
}) {
  void iconColor;
  return (
    <button
      onClick={onPress}
      className={cn(
        "w-full flex items-center px-3.5 py-3 hover:bg-black/[0.04] transition-colors text-left",
      )}
      disabled={!onPress}
    >
      <div
        className="w-8 h-8 rounded-[9px] grid place-items-center mr-3 shrink-0"
        style={{ background: iconBg ?? "rgba(120,120,128,0.12)" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-[15px] font-medium tracking-[-0.2px]",
            destructive ? "text-danger" : "text-text",
          )}
        >
          {label}
        </div>
        {subtitle && (
          <div className="text-[12px] text-muted mt-0.5 truncate">
            {subtitle}
          </div>
        )}
      </div>
      {value && (
        <span className="text-[14px] text-muted mr-1.5 tabular-nums">
          {value}
        </span>
      )}
      {onPress && !destructive && (
        <span className="text-[#C7C7CC] text-base">›</span>
      )}
    </button>
  );
}

/**
 * iOS Settings section: UPPER CASE label + grouped card content.
 */
export function Section({
  title,
  rightLabel,
  rightLabelColor,
  children,
  className,
}: {
  title: string;
  rightLabel?: string;
  rightLabelColor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5", className)}>
      <div className="flex items-end justify-between px-1 mb-1.5">
        <span className="text-[11px] font-semibold text-muted uppercase tracking-[0.6px]">
          {title}
        </span>
        {rightLabel && (
          <span
            className="text-[11px] font-bold tracking-[0.2px]"
            style={{ color: rightLabelColor ?? "var(--color-muted)" }}
          >
            {rightLabel}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-surface border border-border rounded-2xl",
        onClick && "cursor-pointer hover:border-text/20 transition-colors",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  size = "md",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "outline";
  type?: "button" | "submit";
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const sizeCls = size === "sm" ? "px-3 py-1.5 text-[13px]" : "px-4 py-2 text-[14px]";
  const variants = {
    primary: "bg-text text-white hover:opacity-90",
    ghost: "text-text hover:bg-surface-alt",
    danger: "bg-danger text-white hover:opacity-90",
    outline: "bg-surface border border-border text-text hover:bg-surface-alt",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-xl font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50",
        sizeCls,
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full bg-surface-alt border border-border rounded-xl px-3.5 py-2 text-[14px] focus:border-accent",
        className,
      )}
    />
  );
}

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-border",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export function Empty({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="px-6 py-10 flex flex-col items-center text-center">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-surface-alt grid place-items-center mb-3">
          {icon}
        </div>
      )}
      <div className="text-[15px] font-semibold text-text">{title}</div>
      {subtitle && (
        <div className="text-[13px] text-muted mt-1 max-w-sm">{subtitle}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

export function StatTile({
  label,
  value,
  icon,
  accent = "text",
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  accent?: "text" | "primary" | "accent" | "warning" | "points";
}) {
  const colors = {
    text: "text-text",
    primary: "text-primary",
    accent: "text-accent",
    warning: "text-warning",
    points: "text-points",
  };
  return (
    <Card className="px-5 py-4">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider">
          {label}
        </div>
        {icon}
      </div>
      <div
        className={cn(
          "text-[28px] font-bold tracking-tight tabular-nums",
          colors[accent],
        )}
      >
        {value}
      </div>
    </Card>
  );
}
