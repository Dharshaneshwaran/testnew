import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-0.5 text-xs font-medium text-zinc-200 transition-[background-color,border-color] duration-150 ease-out hover:bg-white/[0.05] motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}
