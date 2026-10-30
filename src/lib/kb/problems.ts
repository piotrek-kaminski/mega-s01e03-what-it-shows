// What #4471 actually holds: one problem per thing an engineer would fix. causes.ts places a report by
// its tenant; this file adds what the desk read in the body (desk-notes.json) and the ticket each
// problem now has.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'shift';

// One fix each. Ticket numbers are issues in the repo below.
export const PROBLEMS: readonly { problem: Problem; title: string; fix: string; issue: number }[] = [
  {
    problem: 'parser',
    title: 'Shared parser reads day-first dates month first',
    fix: 'parse with the tenant locale',
    issue: 1,
  },
  {
    problem: 'hint',
    title: 'booking-v3 form hint says MM/DD/YYYY to day-first tenants',
    fix: 'print the hint in the tenant locale',
    issue: 2,
  },
  {
    problem: 'shift',
    title: 'Invites land one day early or late across time zones',
    fix: 'store and send the booking with its time zone',
    issue: 3,
  },
];

export const ISSUES_REPO = 'https://github.com/piotrek-kaminski/mega-s01e03-what-it-shows/issues';

// A one-day move is not a flipped date: no parser or hint bug moves 12 May to 11 May. The desk reads
// the body and lists those reports; everything else goes where its tenant puts it.
export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem | null {
  if (oneDayMove.includes(r.id)) return 'shift';
  return causeOf(r, t);
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // What intake tagged these reports as: tag → count.
  taggedAs: Record<string, number>;
};

export function groupByProblem(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const by = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDayMove) ?? 'unplaced';
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  return [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        taggedAs: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }), {}),
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
