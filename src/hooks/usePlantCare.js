import { useEffect, useState } from 'react';
import { plantCareService } from '../services/plantCareService';

/** Live plant-care state, re-evaluated every 20s so countdowns stay fresh. */
export function usePlantCare() {
  const [state, setState] = useState(() => plantCareService.getState());
  useEffect(() => {
    const unsub = plantCareService.subscribe(setState);
    const iv = setInterval(() => setState(plantCareService.getState()), 20000);
    return () => { unsub(); clearInterval(iv); };
  }, []);
  return state;
}
