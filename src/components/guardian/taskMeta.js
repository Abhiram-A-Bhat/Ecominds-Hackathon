import { LightningIcon as Zap } from '@phosphor-icons/react/dist/csr/Lightning';
import { TrashIcon as Trash2 } from '@phosphor-icons/react/dist/csr/Trash';
import { DropIcon as Droplets } from '@phosphor-icons/react/dist/csr/Drop';
import { PlantIcon as Sprout } from '@phosphor-icons/react/dist/csr/Plant';
import { ForkKnifeIcon as UtensilsCrossed } from '@phosphor-icons/react/dist/csr/ForkKnife';
import { WarningIcon as AlertTriangle } from '@phosphor-icons/react/dist/csr/Warning';

export const TASK_META = {
  ENERGY_CUTOFF: { label: 'Power left on', icon: Zap, accent: '#fbbf24', verb: 'Switch it off by hand' },
  BIN_OVERFLOW:  { label: 'Bin surge', icon: Trash2, accent: '#a3e635', verb: 'Swap the liner' },
  WATER_LEAK:    { label: 'Water leak', icon: Droplets, accent: '#38bdf8', verb: 'Close the valve' },
  FLORA_CARE:    { label: 'Thirsty plant', icon: Sprout, accent: '#4ade80', verb: 'Water it' },
  FOOD_SURPLUS:  { label: 'Surplus food', icon: UtensilsCrossed, accent: '#fb923c', verb: 'Hand out portions' },
};

export const metaFor = (category) => TASK_META[category] || { label: 'Campus task', icon: AlertTriangle, accent: '#34d399', verb: 'Resolve on site' };
