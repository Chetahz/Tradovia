export type DailyCheckin = {
  date: string;
  kind: 'plan' | 'rest';
  focus?: 'setup' | 'risk' | 'review';
  reason?: 'no-setup' | 'risk-limit' | 'news' | 'rest';
  playbookId?: string;
  maxLoss?: number;
  note: string;
  updatedAt: string;
};

export function validateDailyCheckin(
  input: unknown,
  date: string,
  playbookIds: string[],
  hasTradesToday: boolean,
): DailyCheckin {
  if (!input || typeof input !== 'object')
    throw new Error('Invalid daily check-in');
  const value = input as Record<string, unknown>;
  const kind = value.kind;
  if (kind !== 'plan' && kind !== 'rest')
    throw new Error('Invalid daily check-in');
  if (typeof value.note !== 'string' || value.note.length > 240)
    throw new Error('Keep your note under 240 characters');
  const note = value.note.trim();
  if (kind === 'rest') {
    if (hasTradesToday)
      throw new Error('A trade is already recorded for today');
    if (
      !['no-setup', 'risk-limit', 'news', 'rest'].includes(String(value.reason))
    )
      throw new Error('Choose a reason to pause trading');
    return {
      date,
      kind,
      reason: value.reason as DailyCheckin['reason'],
      note,
      updatedAt: new Date().toISOString(),
    };
  }
  if (!['setup', 'risk', 'review'].includes(String(value.focus)))
    throw new Error('Choose one focus for today');
  const playbookId =
    value.playbookId === '' || value.playbookId == null
      ? undefined
      : value.playbookId;
  if (
    playbookId !== undefined &&
    (typeof playbookId !== 'string' || !playbookIds.includes(playbookId))
  )
    throw new Error('Playbook is unavailable');
  const maxLoss =
    value.maxLoss === '' || value.maxLoss == null ? undefined : value.maxLoss;
  if (
    maxLoss !== undefined &&
    (typeof maxLoss !== 'number' ||
      !Number.isFinite(maxLoss) ||
      maxLoss <= 0 ||
      maxLoss > 1e7)
  )
    throw new Error('Invalid daily loss limit');
  return {
    date,
    kind,
    focus: value.focus as DailyCheckin['focus'],
    ...(playbookId ? { playbookId } : {}),
    ...(maxLoss ? { maxLoss } : {}),
    note,
    updatedAt: new Date().toISOString(),
  };
}
