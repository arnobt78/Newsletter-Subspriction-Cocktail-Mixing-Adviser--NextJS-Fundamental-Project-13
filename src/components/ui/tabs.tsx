"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root className={cn("w-full", className)} {...props} />
  );
}

export function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-10 flex-wrap items-center justify-start gap-1 rounded-xl border border-white/10 bg-slate-950/50 p-1 text-slate-300 sm:h-11",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-100 data-[state=active]:ring-1 data-[state=active]:ring-emerald-400/35 sm:px-4 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "mt-4 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40",
        className,
      )}
      {...props}
    />
  );
}
