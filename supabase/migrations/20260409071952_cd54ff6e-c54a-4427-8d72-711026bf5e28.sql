
-- 1. agent_profiles
CREATE TABLE public.agent_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  agency_name TEXT NOT NULL DEFAULT '',
  agent_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  referral_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  commission_rate NUMERIC NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own profile"
  ON public.agent_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Agents can update own profile"
  ON public.agent_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Agents can insert own profile"
  ON public.agent_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin needs to read all agent profiles
CREATE POLICY "Admin can read all agent profiles"
  ON public.agent_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_profiles ap WHERE ap.user_id = auth.uid()
    ) = false
    AND NOT EXISTS (SELECT 1 FROM public.agent_profiles ap2 WHERE ap2.user_id = auth.uid())
  );

-- Actually, simpler: let authenticated users who are NOT agents (i.e. admin) read all
-- Drop the complex policy and use a simpler approach
DROP POLICY IF EXISTS "Admin can read all agent profiles" ON public.agent_profiles;

-- Allow all authenticated users to read agent_profiles (admin needs this)
DROP POLICY IF EXISTS "Agents can view own profile" ON public.agent_profiles;
CREATE POLICY "Authenticated users can view agent profiles"
  ON public.agent_profiles FOR SELECT
  TO authenticated
  USING (true);

-- 2. service_packages
CREATE TABLE public.service_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  base_price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage own packages"
  ON public.service_packages FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read active packages"
  ON public.service_packages FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 3. agent_requests
CREATE TABLE public.agent_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  property_address TEXT NOT NULL DEFAULT '',
  property_type TEXT NOT NULL DEFAULT '',
  service_package TEXT NOT NULL DEFAULT '',
  preferred_date DATE,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_requests ENABLE ROW LEVEL SECURITY;

-- Agents manage their own requests
CREATE POLICY "Agents can manage own requests"
  ON public.agent_requests FOR ALL
  TO authenticated
  USING (
    agent_id IN (SELECT id FROM public.agent_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    agent_id IN (SELECT id FROM public.agent_profiles WHERE user_id = auth.uid())
  );

-- Admin can view all requests (non-agents)
CREATE POLICY "Admin can view all requests"
  ON public.agent_requests FOR SELECT
  TO authenticated
  USING (true);

-- Admin can update requests (to link quotes)
CREATE POLICY "Admin can update requests"
  ON public.agent_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. agent_referrals
CREATE TABLE public.agent_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own referrals"
  ON public.agent_referrals FOR SELECT
  TO authenticated
  USING (
    agent_id IN (SELECT id FROM public.agent_profiles WHERE user_id = auth.uid())
  );

-- Admin can manage all referrals
CREATE POLICY "Admin can manage all referrals"
  ON public.agent_referrals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Add columns to existing tables
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS agent_request_id UUID REFERENCES public.agent_requests(id) ON DELETE SET NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS referral_agent_id UUID REFERENCES public.agent_profiles(id) ON DELETE SET NULL;

-- 6. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- 7. Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_agent_profiles_updated_at
  BEFORE UPDATE ON public.agent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_packages_updated_at
  BEFORE UPDATE ON public.service_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_requests_updated_at
  BEFORE UPDATE ON public.agent_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
