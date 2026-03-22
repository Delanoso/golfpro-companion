export const todayIsoDate = () => new Date().toISOString().slice(0, 10);

export const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
