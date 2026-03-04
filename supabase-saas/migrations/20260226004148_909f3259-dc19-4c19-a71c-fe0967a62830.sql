
-- Create profiles table with onboarding data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  
  -- Onboarding step 1: Product data
  product_name TEXT,
  product_description TEXT,
  product_features TEXT[], -- array of feature strings
  product_category TEXT,
  
  -- Onboarding step 2: Target audience
  target_personas TEXT[], -- e.g. ['budget-conscious parents', 'tech enthusiasts']
  target_age_range TEXT, -- e.g. '25-45'
  target_markets TEXT[], -- e.g. ['Netherlands', 'Germany']
  
  -- Onboarding step 3: Brand voice
  brand_voice TEXT, -- e.g. 'professional', 'casual', 'luxury', 'playful'
  brand_tone_keywords TEXT[], -- e.g. ['trustworthy', 'innovative']
  brand_language TEXT DEFAULT 'en', -- primary content language
  
  -- Onboarding step 4: Desired outcomes
  desired_outcomes TEXT[], -- e.g. ['increase_conversion', 'improve_seo', 'expand_markets']
  primary_marketplace TEXT, -- e.g. 'amazon', 'bolcom', 'both'
  
  -- Meta
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
