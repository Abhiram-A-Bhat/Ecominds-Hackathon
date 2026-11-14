import React, { useState, useEffect } from 'react';
import { fetchCampusWeather, fetchCampusAQI, RNSIT_COORDS } from '../services/weatherService';

export function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [w, a] = await Promise.all([fetchCampusWeather(), fetchCampusAQI()]);
      setWeather(w);
      setAqi(a);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      // Handled in service
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Live poll every 60s
    return () => clearInterval(interval);
  }, []);

  if (loading && !weather) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 16,
        background: 'var(--surface)', border: '1px solid var(--role-line)', color: 'var(--text)',
        borderRadius: 14, padding: '10px 18px', backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--role)', animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
          <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 700 }}>Connecting to RNSIT Weather Station...</span>
        </div>
      </div>
    );
  }

  if (!weather && !aqi) return null;

  return (
    <div style={{
      display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 0,
      background: 'var(--surface-solid)', color: 'var(--text)',
      border: '1px solid var(--role-line)',
      borderRadius: 14, overflow: 'hidden',
      fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      {/* Location & Live Dot */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', borderRight: '1px solid var(--border)'
      }}>
        <span style={{ fontSize: 24 }}>{weather?.emoji || '🌤️'}</span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
              background: 'var(--role)', boxShadow: '0 0 6px var(--role)'
            }} />
            <span style={{
              fontSize: 10, color: 'var(--role)', fontWeight: 800,
              letterSpacing: '0.06em', textTransform: 'uppercase'
            }}>
              LIVE RNSIT TELEMETRY
            </span>
          </div>
          <div style={{ color: 'var(--text)', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span>{weather?.temp}°C</span>
            <span style={{ color: 'var(--text-2)', fontSize: 11, fontWeight: 500, textTransform: 'capitalize' }}>
              {weather?.description}
            </span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-2)', fontFamily: 'monospace' }}>
            RNSIT Campus, RR Nagar ({RNSIT_COORDS.lat}°N, {RNSIT_COORDS.lon}°E)
          </div>
        </div>
      </div>

      {/* Humidity & Pressure */}
      {weather && (
        <div style={{
          padding: '10px 14px', borderRight: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-2)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Humidity
          </div>
          <div style={{ color: 'var(--role)', fontWeight: 800, fontSize: 14 }}>
            {weather.humidity}%
          </div>
          <div style={{ fontSize: 8, color: 'var(--text-3)', fontFamily: 'monospace' }}>
            {weather.pressure} hPa
          </div>
        </div>
      )}

      {/* Wind Speed */}
      {weather && (
        <div style={{
          padding: '10px 14px', borderRight: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-2)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Wind
          </div>
          <div style={{ color: 'var(--text)', fontWeight: 800, fontSize: 14 }}>
            {weather.windSpeed} <span style={{ fontSize: 9, color: 'var(--text-2)' }}>m/s</span>
          </div>
          <div style={{ fontSize: 8, color: 'var(--text-3)', fontFamily: 'monospace' }}>
            NE Breeze
          </div>
        </div>
      )}

      {/* Real AQI Badge */}
      {aqi && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRight: '1px solid var(--border)'
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', background: aqi.color,
            boxShadow: `0 0 8px ${aqi.color}`
          }} />
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-2)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Campus AQI
            </div>
            <div style={{ color: aqi.color, fontWeight: 800, fontSize: 13 }}>
              {aqi.label}
            </div>
            <div style={{ fontSize: 8, color: 'var(--text-3)', fontFamily: 'monospace' }}>
              PM2.5: {aqi.pm25} µg/m³
            </div>
          </div>
        </div>
      )}

      {/* Manual Refresh Button */}
      <button
        onClick={loadData}
        title={`Click to refresh live feed (Updated: ${lastRefreshed})`}
        style={{
          background: 'transparent', border: 'none', padding: '10px 12px',
          color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', transition: 'color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--role)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
}
