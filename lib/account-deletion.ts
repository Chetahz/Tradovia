export function validAccountDeletionConfirmation(value: unknown) {
  if (typeof value !== 'string') return false;
  const normalized = value.trim();
  return normalized.toUpperCase() === 'DELETE' || normalized === 'ลบบัญชี';
}
