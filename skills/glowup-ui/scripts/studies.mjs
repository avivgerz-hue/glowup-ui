// Original worked examples selected by an observed problem, never by a style quota.
const studies = Object.freeze({
  hierarchy: Object.freeze({
    id: 'task-workspace', reference: 'references/studies/task-workspace.md',
    source: 'assets/studies/task-workspace.html',
    use: 'A collection, its next action and overview context compete for equal attention.',
    intervention: 'Promote the working collection; move summary context into a supporting region. Express identity through actual item/date/amount rhythm.',
    reject: 'Do not demote a summary when monitoring that summary is the primary job.',
  }),
  selection: Object.freeze({
    id: 'selection-summary', reference: 'references/studies/selection-summary.md',
    source: 'assets/studies/selection-summary.html',
    use: 'Users must choose among real options while retaining a trustworthy decision summary.',
    intervention: 'Group choices in decision order; keep selected values, price and next action adjacent. On phone, place reassurance near commitment rather than ahead of every option.',
    reject: 'Do not invent steps, forecasts, availability or product imagery to fit this pattern.',
  }),
});

export function selectStudy(problem, { mode = 'transform', depth = 'recompose' } = {}) {
  if (!Object.hasOwn(studies, problem)) throw new Error('Observed problem must be hierarchy or selection');
  if (mode === 'refine' || depth === 'polish') return null;
  return { ...studies[problem], provenance: 'Original hand-authored instructional study, not an agent benchmark',
    instruction: 'Read this one study only if the observed problem fits. Adapt its relationships to real app content; do not transplant its visual theme. Open its captures if image viewing is available.' };
}
