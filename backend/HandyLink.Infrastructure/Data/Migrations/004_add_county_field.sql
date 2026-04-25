-- Migration 004: Add county field to jobs and profiles
-- Run in: Supabase Dashboard > SQL Editor > New Query

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS county TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS county TEXT;
