-- Migration 001: Initial schema
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Date: 2026-03-15

-- Enums
CREATE TYPE job_category AS ENUM (
  'electrical', 'plumbing', 'painting', 'carpentry',
  'furniture_assembly', 'cleaning', 'general', 'other'
);
CREATE TYPE job_status AS ENUM (
  'open', 'bidding', 'accepted', 'in_progress',
  'completed', 'cancelled', 'disputed'
);

-- Profiles (extends Supabase's built-in auth.users table)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  city TEXT,
  country TEXT DEFAULT 'RO',
  bio TEXT,
  role TEXT CHECK (role IN ('client', 'worker', 'both')) DEFAULT 'client',
  expo_push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker-specific details
CREATE TABLE public.worker_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  categories TEXT[] NOT NULL DEFAULT '{}',
  years_experience INTEGER DEFAULT 0,
  portfolio_urls TEXT[] DEFAULT '{}',
  stripe_account_id TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category job_category NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'RO',
  photos TEXT[] DEFAULT '{}',
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  status job_status DEFAULT 'open',
  accepted_bid_id UUID,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  price_estimate DECIMAL(10,2) NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending','accepted','rejected','withdrawn')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, worker_id)
);

ALTER TABLE public.jobs ADD CONSTRAINT fk_accepted_bid
  FOREIGN KEY (accepted_bid_id) REFERENCES public.bids(id);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
  worker_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, reviewer_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  reference_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_category ON public.jobs(category);
CREATE INDEX idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX idx_bids_job_id ON public.bids(job_id);
CREATE INDEX idx_bids_worker_id ON public.bids(worker_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bids_updated_at BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-recalculate worker average rating on new review
CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.worker_profiles SET
    average_rating = (SELECT AVG(rating) FROM public.reviews WHERE worker_id = NEW.worker_id),
    total_reviews  = (SELECT COUNT(*)    FROM public.reviews WHERE worker_id = NEW.worker_id)
  WHERE id = NEW.worker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_worker_rating AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_worker_rating();
