import { profileFor } from '../data/plantProfiles';

const FILES = {
  tulsi: 'tulsi', hibiscus: 'hibiscus', areca: 'areca', neem: 'neem-sapling',
  aloe: 'aloe', money: 'money-plant', marigold: 'marigold', snake: 'snake-plant',
  default: 'tulsi',
};

export function plantImagePath(plant) {
  const key = plant && typeof plant === 'object' ? profileFor(plant).key : 'default';
  return `/plants/${FILES[key] || FILES.default}.png`;
}

export function plantConditionClass(level = 'healthy') {
  if (level === 'flagged') return 'plant-mood--flagged';
  if (level === 'overdue') return 'plant-mood--overdue';
  if (level === 'thirsty') return 'plant-mood--thirsty';
  return 'plant-mood--healthy';
}
