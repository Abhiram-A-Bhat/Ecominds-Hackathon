create table if not exists public.latest_bin_readings (
  bin_id text primary key check (char_length(bin_id) between 1 and 32),
  bin_name text not null check (char_length(bin_name) <= 100),
  device_id text not null check (char_length(device_id) between 1 and 64),
  fill_percent numeric(4, 1) not null check (fill_percent between 0 and 100),
  space_left_percent numeric(4, 1) not null check (space_left_percent between 0 and 100),
  measured_at timestamptz not null
);

alter table public.latest_bin_readings enable row level security;

revoke all on table public.latest_bin_readings from public, anon, authenticated;
grant select on table public.latest_bin_readings to anon;
grant all on table public.latest_bin_readings to service_role;

drop policy if exists "Public can read live bin fill levels" on public.latest_bin_readings;
create policy "Public can read live bin fill levels"
  on public.latest_bin_readings
  for select
  to anon
  using (true);
