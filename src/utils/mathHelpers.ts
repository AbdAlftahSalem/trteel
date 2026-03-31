export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const parseAyah = (
  value: string,
  fallback: number,
  min: number,
  max: number,
) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return clamp(Math.floor(parsed), min, max);
};
