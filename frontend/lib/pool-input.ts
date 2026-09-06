const minuteMultipliers: Record<string, number> = {
  minutes: 1,
  hours: 60,
  days: 1440,
};

export function formationSeconds(length: string, unit: string) {
  const multiplier = minuteMultipliers[unit];
  if (!Object.hasOwn(minuteMultipliers, unit) || !/^[0-9]+$/.test(length))
    throw new Error(
      "Choose a whole-number formation window in minutes, hours or days.",
    );
  const seconds = Number(length) * multiplier * 60;
  if (!Number.isSafeInteger(seconds) || seconds < 60 || seconds > 90 * 86400)
    throw new Error("Formation must be between one minute and 90 days.");
  return seconds;
}
