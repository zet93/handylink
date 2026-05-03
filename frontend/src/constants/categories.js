export const CATEGORY_LABELS = {
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

export function getCategoryLabel(raw) {
  return CATEGORY_LABELS[raw] ?? raw;
}
