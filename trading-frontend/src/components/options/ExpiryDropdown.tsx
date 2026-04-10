"use client";

import { ExpiryItem } from "@/types/option";

export function ExpiryDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: ExpiryItem[];
  onChange: (next: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition hover:border-white/20 focus:border-emerald-400"
    >
      {options.map((expiry) => (
        <option key={expiry.value} value={expiry.value} className="bg-zinc-900 text-zinc-100">
          {expiry.label}
        </option>
      ))}
    </select>
  );
}
