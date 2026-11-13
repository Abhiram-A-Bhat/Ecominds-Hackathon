export const ECO_LEVELS = [
  { level: 1, title: 'Eco Seed 🌱', floor: 0, next: 200 },
  { level: 2, title: 'Green Sprout 🌿', floor: 200, next: 500 },
  { level: 3, title: 'Forest Guardian 🌲', floor: 500, next: 1000 },
  { level: 4, title: 'Bio-Sphere Architect 🌍', floor: 1000, next: 2500 },
  { level: 5, title: 'Planetary Hero 🏆', floor: 2500, next: null },
];

export function getEcoLevel(points = 0) {
  const total = Math.max(0, Number(points) || 0);
  const current = [...ECO_LEVELS].reverse().find(item => total >= item.floor) || ECO_LEVELS[0];
  const progress = current.next == null
    ? 100
    : Math.min(100, Math.round(((total - current.floor) / (current.next - current.floor)) * 100));
  return { ...current, points: total, progress, pointsToNext: current.next == null ? 0 : current.next - total };
}
