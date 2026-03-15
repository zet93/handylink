-- Migration 002: Row Level Security policies
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Date: 2026-03-15

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, owner write
CREATE POLICY "profiles_select_all"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Worker profiles: public read, owner write
CREATE POLICY "worker_select_all"     ON public.worker_profiles FOR SELECT USING (true);
CREATE POLICY "worker_manage_own"     ON public.worker_profiles FOR ALL USING (auth.uid() = id);

-- Jobs: authenticated users read all; clients manage their own
CREATE POLICY "jobs_select_auth"      ON public.jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "jobs_insert_client"    ON public.jobs FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "jobs_update_client"    ON public.jobs FOR UPDATE USING (auth.uid() = client_id);

-- Bids: workers see their own + client sees bids on their jobs
CREATE POLICY "bids_select"           ON public.bids FOR SELECT USING (
  auth.uid() = worker_id OR
  EXISTS (SELECT 1 FROM public.jobs WHERE id = bids.job_id AND client_id = auth.uid())
);
CREATE POLICY "bids_insert_worker"    ON public.bids FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "bids_update_worker"    ON public.bids FOR UPDATE USING (auth.uid() = worker_id);

-- Reviews: public read, reviewer write
CREATE POLICY "reviews_select_all"    ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own"    ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Notifications: owner only
CREATE POLICY "notifications_own"     ON public.notifications FOR ALL USING (auth.uid() = user_id);
