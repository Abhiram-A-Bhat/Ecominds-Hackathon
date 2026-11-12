// Weather and Air Pollution Service for Guardian Campus OS
// Real-time telemetry from OpenWeatherMap API for RNSIT Campus, Bengaluru
// Latitude: 12.9018 N, Longitude: 77.5184 E (Dr. Vishnuvardhan Road, RR Nagar)

const OWM_KEY = import.meta.env.VITE_OWM_KEY || '';
export const RNSIT_COORDS = { lat: 12.9018, lon: 77.5184 };

export function getWeatherEmoji(description = '') {
  const d = description.toLowerCase();
  if (d.includes('thunder')) return '⛈️';
  if (d.includes('rain') || d.includes('drizzle')) return '🌧️';
  if (d.includes('cloud')) return '⛅';
  if (d.includes('clear')) return '☀️';
  if (d.includes('mist') || d.includes('fog') || d.includes('haze')) return '🌫️';
  if (d.includes('snow')) return '❄️';
  return '🌤️';
}

export const AQI_LABELS = ['', 'Good (AQI 1)', 'Fair (AQI 2)', 'Moderate (AQI 3)', 'Poor (AQI 4)', 'Very Poor (AQI 5)'];
export const AQI_COLORS = ['', '#34d399', '#86efac', '#fbbf24', '#f87171', '#ef4444'];

let cachedWeather = null;
let cachedAqi = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

export async function fetchCampusWeather() {
  const now = Date.now();
  if (cachedWeather && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedWeather;
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${RNSIT_COORDS.lat}&lon=${RNSIT_COORDS.lon}&appid=${OWM_KEY}&units=metric`
    );
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
    const data = await res.json();
    cachedWeather = {
      temp: Math.round(data.main.temp),
      exactTemp: data.main.temp,
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind?.speed || 0,
      clouds: data.clouds?.all ?? null,
      rainMm: data.rain?.['1h'] ?? (data.rain?.['3h'] != null ? data.rain['3h'] / 3 : 0), // mm in the last hour
      description: data.weather[0]?.description || 'Clear Sky',
      emoji: getWeatherEmoji(data.weather[0]?.description),
      cityName: 'RNSIT Campus, RR Nagar',
      timestamp: new Date().toLocaleTimeString(),
      isReal: true
    };
    lastFetchTime = now;
    return cachedWeather;
  } catch (err) {
    console.warn('[Guardian Campus Weather] Falling back to last known reading:', err);
    return cachedWeather || {
      temp: 25,
      exactTemp: 25.0,
      feelsLike: 26,
      humidity: 82,
      pressure: 1010,
      windSpeed: 2.8,
      description: 'light rain',
      emoji: '🌧️',
      cityName: 'RNSIT Campus, RR Nagar',
      timestamp: new Date().toLocaleTimeString(),
      isReal: false
    };
  }
}

let cachedForecast = null;
let forecastAt = 0;

/** Next ~6 hours from the 3-hourly forecast: chance of rain and expected rainfall. */
export async function fetchCampusForecast() {
  const now = Date.now();
  if (cachedForecast && now - forecastAt < 10 * 60e3) return cachedForecast;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${RNSIT_COORDS.lat}&lon=${RNSIT_COORDS.lon}&appid=${OWM_KEY}&units=metric&cnt=2`
    );
    if (!res.ok) throw new Error(`Forecast fetch failed: ${res.status}`);
    const data = await res.json();
    const slots = (data.list || []).slice(0, 2);
    cachedForecast = {
      popNext6h: Math.max(0, ...slots.map(x => x.pop ?? 0)),
      rainNext6hMm: +slots.reduce((sum, x) => sum + (x.rain?.['3h'] || 0), 0).toFixed(1),
      maxTempNext6h: Math.round(Math.max(...slots.map(x => x.main?.temp_max ?? -99))),
      isReal: true,
    };
    forecastAt = now;
    return cachedForecast;
  } catch (err) {
    console.warn('[Guardian Campus Forecast] unavailable:', err);
    return cachedForecast || { popNext6h: 0, rainNext6hMm: 0, isReal: false };
  }
}

export async function fetchCampusAQI() {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${RNSIT_COORDS.lat}&lon=${RNSIT_COORDS.lon}&appid=${OWM_KEY}`
    );
    if (!res.ok) throw new Error(`AQI fetch failed: ${res.status}`);
    const data = await res.json();
    const item = data.list[0];
    const aqiVal = item.main.aqi;
    const comp = item.components;
    cachedAqi = {
      aqi: aqiVal,
      label: AQI_LABELS[aqiVal] || 'Moderate',
      color: AQI_COLORS[aqiVal] || '#fbbf24',
      pm25: comp.pm2_5 ? comp.pm2_5.toFixed(1) : '24.2',
      pm10: comp.pm10 ? comp.pm10.toFixed(1) : '48.6',
      no2: comp.no2 ? comp.no2.toFixed(1) : '15.1',
      o3: comp.o3 ? comp.o3.toFixed(1) : '32.0',
      isReal: true
    };
    return cachedAqi;
  } catch (err) {
    console.warn('[Guardian Campus AQI] Falling back to default AQI:', err);
    return {
      aqi: 2,
      label: 'Fair (AQI 2)',
      color: '#86efac',
      pm25: '24.2',
      pm10: '48.6',
      no2: '15.1',
      o3: '32.0',
      isReal: false
    };
  }
}
