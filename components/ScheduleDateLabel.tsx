"use client";

import { useClientNow } from "@/lib/useClientNow";
import { fmtDate } from "./ScheduleRow";

// v1.0.194 -- tiny Client Component leaf so app/schedule/[competitionId]/
// page.tsx (a statically-prerendered Server Component, generateStaticParams()
// -- confirmed via `npm run build`'s SSG "●" marker) can render a
// "Today"/"Tomorrow"/short-date label that's computed fresh on every
// visitor's own client, instead of once at build time. A Server Component
// can render a Client Component child directly -- this is the standard,
// sanctioned pattern for embedding one bit of runtime-fresh UI inside an
// otherwise-static page, and it's the same fmtDate() already fixed in
// ScheduleRow.tsx (imported, not duplicated) so there's exactly one
// "Today/Tomorrow" implementation in the app. Renders nothing until
// mounted, matching the server's placeholder-free render exactly.
export default function ScheduleDateLabel({ iso }: { iso: string }) {
  const now = useClientNow();
  if (now === null) return null;
  return <>{fmtDate(iso, now)}</>;
}
