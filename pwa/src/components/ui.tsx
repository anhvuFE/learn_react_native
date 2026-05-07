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
    <div className="flex items-end justify-between mb-6">
      <div>
        <h1 className="text-[26px] font-bold text-text tracking-tight">
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
