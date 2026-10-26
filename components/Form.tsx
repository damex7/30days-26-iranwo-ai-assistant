"use client";

import { useFormStatus } from "react-dom";

export function Field({
  name, label, error, hint, as = "input", children, ...rest
}: {
  name: string; label: string; error?: string; hint?: string; as?: "input" | "textarea" | "select"; children?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const describedBy = [hint && `${name}-hint`, error && `${name}-err`].filter(Boolean).join(" ") || undefined;
  const common = { id: name, name, className: "input", "aria-invalid": error ? true : undefined, "aria-describedby": describedBy };
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      {as === "textarea" ? (
        <textarea {...common} {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : as === "select" ? (
        <select {...common} defaultValue={rest.defaultValue as string}>{children}</select>
      ) : (
        <input {...common} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {hint && <p id={`${name}-hint`} className="hint">{hint}</p>}
      {error && <p id={`${name}-err`} className="err" role="alert">{error}</p>}
    </div>
  );
}

export function Submit({ children, pending }: { children: React.ReactNode; pending?: string }) {
  const { pending: isPending } = useFormStatus();
  return <button className="btn" disabled={isPending} aria-busy={isPending}>{isPending ? pending ?? "Working…" : children}</button>;
}
