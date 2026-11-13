const asLiveReading = row => ({
  binId: row.bin_id,
  binName: row.bin_name,
  deviceId: row.device_id,
  fillPercent: row.fill_percent,
  spaceLeftPercent: row.space_left_percent,
  measuredAt: row.measured_at,
});

/** Fetch shared cloud telemetry when configured, otherwise use the local API. */
export async function fetchLiveBinReading(binId) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (supabaseUrl && publishableKey) {
    const query = new URLSearchParams({
      select: 'bin_id,bin_name,device_id,fill_percent,space_left_percent,measured_at',
      bin_id: `eq.${binId}`,
      limit: '1',
    });
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/latest_bin_readings?${query}`, {
        headers: { apikey: publishableKey },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Cloud sensor feed is unavailable');
      const rows = await response.json();
      if (Array.isArray(rows) && rows.length) return asLiveReading(rows[0]);
      if (!import.meta.env.DEV) return null;
    } catch (error) {
      if (!import.meta.env.DEV) throw error;
    }
  }

  // In local development, keep the physical feed visible if the cloud relay is
  // temporarily offline or has not received its first reading yet.
  const response = await fetch(`/api/bin-readings/latest?bin_id=${encodeURIComponent(binId)}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Local sensor API is unavailable');
  const data = await response.json();
  return data.reading || null;
}
