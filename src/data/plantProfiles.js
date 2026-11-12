// ─── Plant care profiles ─────────────────────────────────────────────────────
// Base watering needs per species for Bengaluru's climate (pot / bed sizes as
// planted on campus). The schedule engine in plantCareService adjusts these for
// live weather: heat and dry air shorten the gap and raise the amount; rain
// lengthens the gap for outdoor plants; indoor plants are only mildly affected.
//
//   baseIntervalHrs  hours between waterings in mild weather (≈25 °C, 60% RH)
//   baseMl           water per session
//   window           best time of day to water ('morning' | 'evening')
//   indoor           sheltered from rain
//   tolerance        'thirsty' plants react strongly to heat; 'succulent' barely does

export const PLANT_PROFILES = {
  tulsi:    { label: 'Holy basil', baseIntervalHrs: 24, baseMl: 250, window: 'morning', indoor: false, tolerance: 'thirsty',   tip: 'Water at the base, not on the leaves. Soil should stay just moist.' },
  hibiscus: { label: 'Flowering shrub', baseIntervalHrs: 24, baseMl: 500, window: 'morning', indoor: false, tolerance: 'thirsty', tip: 'Drops buds when dry. Soak until water drains from the bed.' },
  areca:    { label: 'Indoor palm', baseIntervalHrs: 72, baseMl: 600, window: 'morning', indoor: true, tolerance: 'moderate',    tip: 'Let the top 2 cm of soil dry between waterings. Brown tips mean too little.' },
  neem:     { label: 'Young tree', baseIntervalHrs: 48, baseMl: 1500, window: 'evening', indoor: false, tolerance: 'moderate',  tip: 'Saplings need a deep soak; mature neem is drought hardy.' },
  aloe:     { label: 'Succulent', baseIntervalHrs: 168, baseMl: 200, window: 'morning', indoor: false, tolerance: 'succulent', tip: 'Only water when the soil is fully dry. Overwatering rots the roots.' },
  money:    { label: 'Climber', baseIntervalHrs: 72, baseMl: 300, window: 'morning', indoor: true, tolerance: 'moderate',     tip: 'Yellow leaves mean overwatering; droopy leaves mean it is thirsty.' },
  marigold: { label: 'Flower bed', baseIntervalHrs: 24, baseMl: 800, window: 'evening', indoor: false, tolerance: 'thirsty',  tip: 'Water the soil, not the flowers, to avoid fungus.' },
  snake:    { label: 'Hardy succulent', baseIntervalHrs: 240, baseMl: 250, window: 'morning', indoor: true, tolerance: 'succulent', tip: 'Thrives on neglect. Water sparingly, even less in cool months.' },
  default:  { label: 'Plant', baseIntervalHrs: 48, baseMl: 400, window: 'morning', indoor: false, tolerance: 'moderate',      tip: 'Check the top of the soil; water when it feels dry.' },
};

const BY_NAME = [
  [/tulsi|basil/i, 'tulsi'], [/hibiscus/i, 'hibiscus'], [/areca|palm/i, 'areca'], [/neem/i, 'neem'],
  [/aloe/i, 'aloe'], [/money/i, 'money'], [/marigold/i, 'marigold'], [/snake/i, 'snake'],
];

export function profileFor(plant) {
  const key = plant.profile || BY_NAME.find(([re]) => re.test(`${plant.name} ${plant.species}`))?.[1] || 'default';
  return { key, ...PLANT_PROFILES[key] };
}

// ── Plain-language units ────────────────────────────────────────────────────
/** 250 → "0.25 L", 1500 → "1.5 L" */
export const litres = (ml) => `${Number((ml / 1000).toFixed(2))} L`;

/** 36 → "1½ days", 24 → "1 day", 12 → "½ day" */
export function days(hours) {
  const d = Math.round(hours / 12) / 2;
  const whole = Math.floor(d), half = d - whole >= 0.5;
  if (whole === 0) return '½ day';
  return `${whole}${half ? '½' : ''} day${whole === 1 && !half ? '' : 's'}`;
}

/** 24 → "day", 36 → "1½ days" — for "each further …" phrasing */
export const perDays = (hours) => (Math.round(hours / 12) === 2 ? 'day' : days(hours));

/** 12 → "twice a day", 24 → "every day", 48 → "every 2 days", 168 → "once a week" */
export function everyDays(hours) {
  if (hours <= 12) return 'twice a day';
  if (hours === 24) return 'every day';
  if (hours === 168) return 'once a week';
  return `every ${days(hours)}`;
}

export const WINDOWS = {
  morning: { startH: 6, endH: 9, label: '6–9 AM' },
  evening: { startH: 17, endH: 19, label: '5–7 PM' },
};

/**
 * Work out how much and how often to water, given the species and weather.
 * Returns { intervalHrs, ml, window, reasons[] } — reasons explain each adjustment.
 */
export function computeSchedule(plant, weather) {
  const pr = profileFor(plant);
  let interval = pr.baseIntervalHrs;
  let ml = pr.baseMl;
  const reasons = [`${pr.label}: normally ${litres(pr.baseMl)} ${everyDays(pr.baseIntervalHrs)}`];

  if (weather) {
    const sens = pr.tolerance === 'thirsty' ? 1 : pr.tolerance === 'succulent' ? 0.35 : 0.65;
    const shelter = pr.indoor ? 0.4 : 1;
    const t = weather.temp ?? 25;
    // Trust measured rainfall; only fall back to the text description for live readings
    const rain = (weather.rainMm ?? 0) >= 0.2 || (weather.source !== 'fallback' && weather.rainMm == null && /rain|drizzle|thunder|shower/i.test(weather.description || ''));

    if (t >= 32) {
      interval *= 1 - 0.3 * sens * shelter; ml *= 1 + 0.3 * sens * shelter;
      reasons.push(`Hot (${t}°C): water sooner and ${Math.round(30 * sens * shelter)}% more`);
    } else if (t >= 28) {
      interval *= 1 - 0.12 * sens * shelter; ml *= 1 + 0.12 * sens * shelter;
      reasons.push(`Warm (${t}°C): slightly more often`);
    } else if (t <= 20) {
      interval *= 1 + 0.25 * shelter; ml *= 1 - 0.15 * shelter;
      reasons.push(`Cool (${t}°C): less evaporation, longer gap`);
    }

    if ((weather.humidity ?? 60) <= 40) {
      interval *= 1 - 0.1 * sens; reasons.push(`Dry air (${weather.humidity}%): soil dries faster`);
    } else if ((weather.humidity ?? 60) >= 85) {
      interval *= 1.1; reasons.push(`Humid (${weather.humidity}%): soil stays moist longer`);
    }

    if ((weather.wind ?? 0) >= 6) {
      interval *= 1 - 0.1 * sens * shelter; reasons.push(`Windy (${weather.wind} m/s): soil dries faster`);
    }
    if ((weather.clouds ?? 0) >= 85 && !rain) {
      interval *= 1.05; reasons.push(`Overcast (${weather.clouds}% cloud): less evaporation`);
    }

    if (rain && !pr.indoor) {
      interval *= 1.5; ml *= 0.6;
      reasons.push(weather.rainMm ? `Raining (${weather.rainMm} mm in the last hour): outdoor soil topped up — gap stretched, less water` : 'Rain on campus: outdoor soil is topped up — gap stretched, less water');
    } else if (rain && pr.indoor) {
      reasons.push('Rain ignored: this plant is indoors');
    }

    if (!pr.indoor && !rain && (weather.popNext6h ?? 0) >= 0.6 && (weather.rainNext6hMm ?? 0) >= 1) {
      interval += 6;
      reasons.push(`Rain likely in the next 6 hours (${Math.round(weather.popNext6h * 100)}%, ~${weather.rainNext6hMm} mm) — reminder held back to let it water the plant`);
    }
  }

  // Round to something a student can actually follow
  const intervalHrs = Math.max(12, Math.round(interval / 12) * 12); // half-day steps
  const roundedMl = Math.max(50, Math.round(ml / 50) * 50);
  return { profile: pr.key, intervalHrs, ml: roundedMl, window: pr.window, indoor: pr.indoor, tip: pr.tip, reasons };
}
