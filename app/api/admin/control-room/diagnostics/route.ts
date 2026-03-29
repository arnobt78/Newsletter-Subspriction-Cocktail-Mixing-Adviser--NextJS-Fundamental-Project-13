import { NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/admin-api-auth";

const cocktailBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://www.thecocktaildb.com/api/json/v1/1";

export async function GET(): Promise<
  NextResponse<
    | {
        ok: true;
        generatedAt: string;
        cocktailDb: { ok: boolean; ms: number; status: number };
      }
    | { ok: false }
  >
> {
  if (!(await assertAdminSession())) {
    return NextResponse.json({ ok: false as const }, { status: 401 });
  }

  const started = Date.now();
  let cocktailDb = { ok: false, ms: 0, status: 0 };
  try {
    const r = await fetch(`${cocktailBase.replace(/\/$/, "")}/search.php?s=a`, {
      cache: "no-store",
    });
    cocktailDb = {
      ok: r.ok,
      ms: Date.now() - started,
      status: r.status,
    };
  } catch {
    cocktailDb = {
      ok: false,
      ms: Date.now() - started,
      status: 0,
    };
  }

  return NextResponse.json({
    ok: true as const,
    generatedAt: new Date().toISOString(),
    cocktailDb,
  });
}
