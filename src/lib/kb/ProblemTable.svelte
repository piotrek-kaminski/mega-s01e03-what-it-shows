<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem, ISSUES_REPO, PROBLEMS } from '#lib/kb/problems';

  let { ticket }: { ticket: number } = $props();

  const groups = $derived(groupByProblem(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const total = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket).length);
  const shiftIssue = PROBLEMS.find((x) => x.problem === 'shift')?.issue;
  const exported = (reports as Report[]).length;
  const info = (p: string) => PROBLEMS.find((x) => x.problem === p);
  const tags = (g: { taggedAs: Record<string, number> }) =>
    Object.entries(g.taggedAs)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${tag} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{total}</strong> reports merged into #{ticket} · <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
  <span class="muted">({exported} rows in the export; {exported - total} are the same report twice)</span>
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>intake tagged</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      {@const p = info(g.problem)}
      <tr class:unplaced={!p}>
        <td><code>{g.problem}</code>{#if p}<br /><span class="muted">{p.title}</span>{/if}</td>
        <td>
          <strong>{g.reports.length}</strong>
          {#if g.alsoShift}<br /><span class="muted">{g.alsoShift} also under <code>shift</code> (#{shiftIssue})</span>{/if}
        </td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td class="muted">{tags(g)}</td>
        <td>{#if p}<a href="{ISSUES_REPO}/{p.issue}">#{p.issue}</a>{:else}none yet{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="muted">
  Counted the way the desk's own view counts (<code>CauseTable</code>, as exported): every report where its
  tenant files it. One-day moves stay there and are counted under <code>shift</code> as well, so the rows add up
  to more than {total}.
</p>

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .unplaced td { background: var(--warn-bg); }
</style>
