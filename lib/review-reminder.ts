export type ReviewReminder = {
  enabled: boolean;
  time: string;
  quietStart: string;
  quietEnd: string;
};

export const defaultReviewReminder: ReviewReminder = {
  enabled: false,
  time: '20:00',
  quietStart: '22:00',
  quietEnd: '07:00',
};

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function validateReviewReminder(value: unknown): ReviewReminder {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid review reminder');
  const reminder = value as Partial<ReviewReminder>;
  if (
    typeof reminder.enabled !== 'boolean' ||
    typeof reminder.time !== 'string' ||
    typeof reminder.quietStart !== 'string' ||
    typeof reminder.quietEnd !== 'string' ||
    !TIME_PATTERN.test(reminder.time) ||
    !TIME_PATTERN.test(reminder.quietStart) ||
    !TIME_PATTERN.test(reminder.quietEnd)
  )
    throw new Error('Invalid review reminder');
  return {
    enabled: reminder.enabled,
    time: reminder.time,
    quietStart: reminder.quietStart,
    quietEnd: reminder.quietEnd,
  };
}

const minutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

export function isQuietTime(
  currentTime: string,
  quietStart: string,
  quietEnd: string,
) {
  const current = minutes(currentTime);
  const start = minutes(quietStart);
  const end = minutes(quietEnd);
  if (start === end) return false;
  return start < end
    ? current >= start && current < end
    : current >= start || current < end;
}

export function reviewReminderDue(
  currentTime: string,
  reminder?: ReviewReminder,
) {
  const value = reminder ?? defaultReviewReminder;
  return (
    value.enabled &&
    minutes(currentTime) >= minutes(value.time) &&
    !isQuietTime(currentTime, value.quietStart, value.quietEnd)
  );
}
