"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ADMIN_GET_PROBE_ROUTES } from "@/data/project-api-registry";
import { cn } from "@/lib/utils";

type ProbeRow = {
  id: string;
  label: string;
  path: string;
  httpStatus: number;
  ms: number;
  error?: string;
};

type DiagnosticsPayload = {
  ok: true;
  generatedAt: string;
  cocktailDb: { ok: boolean; ms: number; status: number };
};

export function AdminApiStatusPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsPayload | null>(null);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [rows, setRows] = useState<ProbeRow[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const runProbes = useCallback(async () => {
    setRunning(true);
    setDiagError(null);
    const next: ProbeRow[] = [];
    try {
      const tDiag = performance.now();
      try {
        const dr = await fetch("/api/admin/control-room/diagnostics", {
          credentials: "include",
          cache: "no-store",
        });
        const diagMs = Math.round(performance.now() - tDiag);
        if (dr.ok) {
          const body = (await dr.json()) as DiagnosticsPayload | { ok: false };
          if (body.ok === true) {
            setDiagnostics(body);
          } else {
            setDiagnostics(null);
            setDiagError(`Diagnostics ${dr.status} (${diagMs} ms)`);
          }
        } else {
          setDiagnostics(null);
          setDiagError(`Diagnostics ${dr.status} (${diagMs} ms)`);
        }
      } catch {
        setDiagnostics(null);
        setDiagError("Diagnostics request failed");
      }

      for (const route of ADMIN_GET_PROBE_ROUTES) {
        const id = route.path;
        const t0 = performance.now();
        try {
          const r = await fetch(route.path, {
            method: route.method,
            credentials: "include",
            cache: "no-store",
          });
          const ms = Math.round(performance.now() - t0);
          next.push({
            id,
            label: route.label,
            path: route.path,
            httpStatus: r.status,
            ms,
          });
        } catch (e) {
          next.push({
            id,
            label: route.label,
            path: route.path,
            httpStatus: 0,
            ms: Math.round(performance.now() - t0),
            error: e instanceof Error ? e.message : "Failed",
          });
        }
      }

      setRows(next);
      setCheckedAt(new Date().toISOString());
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    void runProbes();
    const id = window.setInterval(() => void runProbes(), 30_000);
    return () => window.clearInterval(id);
  }, [runProbes]);

  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading sm:text-3xl">
            API status
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400 sm:text-base">
            Live checks from your browser (admin GET routes) plus a server-side TheCocktailDB
            ping. Refreshes every 30 seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runProbes()}
          disabled={running}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/35 bg-cyan-500/20 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30 disabled:opacity-50"
        >
          {running ? "Checking…" : "Refresh now"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            TheCocktailDB (server)
          </h2>
          {diagError ? (
            <p className="mt-2 text-sm text-rose-300">{diagError}</p>
          ) : diagnostics ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Badge
                className={
                  diagnostics.cocktailDb.ok
                    ? "border border-emerald-300/35 bg-emerald-500/20 text-emerald-100"
                    : "border border-rose-300/35 bg-rose-500/20 text-rose-100"
                }
              >
                {diagnostics.cocktailDb.ok ? "Reachable" : "Issue"}
              </Badge>
              <span className="text-sm tabular-nums text-slate-300">
                {diagnostics.cocktailDb.ms} ms · HTTP {diagnostics.cocktailDb.status || "—"}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Waiting…</p>
          )}
          {diagnostics ? (
            <p className="mt-2 text-xs text-slate-500">
              Server time {new Date(diagnostics.generatedAt).toLocaleString()}
            </p>
          ) : null}
        </Card>

        <Card className="glass-panel border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Probe schedule
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {checkedAt
              ? `Last run ${new Date(checkedAt).toLocaleString()} · auto every 30s`
              : "Running first check…"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            401 on a route still means the handler is alive; you are simply not sending a valid
            session from this context.
          </p>
        </Card>
      </div>

      <Card className="mt-4 glass-panel border-white/10 bg-white/[0.03] p-0 overflow-hidden sm:mt-5">
        <div className="border-b border-white/10 px-4 py-3 sm:px-5">
          <h2 className="text-lg font-semibold text-white">GET routes (browser)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-white/10 text-[0.65rem] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold sm:px-5">Endpoint</th>
                <th className="px-2 py-3 font-semibold sm:px-3">Status</th>
                <th className="px-2 py-3 font-semibold sm:px-3">Latency</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500 sm:px-5">
                    {running ? "Probing…" : "No results yet."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 sm:px-5">
                      <div className="font-medium text-slate-200">{row.label}</div>
                      <code className="mt-0.5 block break-all text-xs text-cyan-200/80">
                        {row.path}
                      </code>
                      {row.error ? (
                        <span className="mt-1 block text-xs text-rose-300">{row.error}</span>
                      ) : null}
                    </td>
                    <td className="px-2 py-3 sm:px-3">
                      <Badge
                        className={cn(
                          row.error
                            ? "border border-rose-300/35 bg-rose-500/15 text-rose-100"
                            : row.httpStatus >= 200 && row.httpStatus < 300
                              ? "border border-emerald-300/35 bg-emerald-500/15 text-emerald-100"
                              : row.httpStatus === 401
                                ? "border border-amber-300/35 bg-amber-500/15 text-amber-100"
                                : row.httpStatus > 0
                                  ? "border border-rose-300/35 bg-rose-500/15 text-rose-100"
                                  : "border border-slate-500/35 bg-slate-500/15 text-slate-200",
                        )}
                      >
                        {row.httpStatus || "—"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 tabular-nums text-slate-300 sm:px-3">
                      {row.ms} ms
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
