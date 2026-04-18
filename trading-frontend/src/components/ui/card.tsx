import * as React from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-2xl border border-white/10 bg-zinc-900/70 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-[border-color,box-shadow,transform] duration-200 ease-out hover:border-white/15 hover:shadow-[0_16px_50px_rgba(0,0,0,0.35)] motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("px-4 py-3", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-title" className={cn("text-sm font-semibold tracking-wide text-zinc-100", className)} {...props} />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-4 pb-4", className)} {...props} />;
}

export { Card, CardContent, CardHeader, CardTitle };
