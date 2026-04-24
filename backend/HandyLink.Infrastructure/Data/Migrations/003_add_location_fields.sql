-- Migration 003: Add location fields to jobs and worker_profiles
-- Run in: Supabase Dashboard > SQL Editor > New Query

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS address   TEXT;

ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS latitude          DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS longitude         DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS service_radius_km INTEGER;
