import React from 'react';
import { plantConditionClass, plantImagePath } from '../utils/plantArt';

export function PlantArt({ plant, level = 'healthy', size = 56, className = '', title }) {
  return (
    <span
      className={`plant-art ${plantConditionClass(level)} ${className}`.trim()}
      style={{ '--plant-size': `${size}px` }}
      aria-hidden="true"
    >
      <img src={plantImagePath(plant)} alt="" draggable="false" title={title || plant?.name || 'Campus plant'} />
    </span>
  );
}
