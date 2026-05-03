export const CATEGORY_LABELS: Record<string, string> = {
  electrical: 'Electrician',
  plumbing: 'Instalator',
  painting: 'Zugrav',
  carpentry: 'Tâmplărie',
  furniture_assembly: 'Mobilă',
  cleaning: 'Curățenie',
  general: 'General',
  other: 'Altele',
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

export function getCategoryLabel(raw: string): string {
  return CATEGORY_LABELS[raw] ?? raw;
}
