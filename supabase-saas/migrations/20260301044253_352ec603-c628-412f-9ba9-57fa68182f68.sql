
-- Create brands table
CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  description text,
  logo_url text,
  -- Voice tab
  voice_tone text,
  voice_personality text,
  voice_language text DEFAULT 'en',
  voice_keywords text[],
  voice_examples text,
  -- Rules tab
  rules_dos text[],
  rules_donts text[],
  rules_grammar_notes text,
  -- Templates tab (JSON array of template objects)
  templates jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Policies scoped to workspace membership
CREATE POLICY "Members can view workspace brands"
  ON public.brands FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create workspace brands"
  ON public.brands FOR INSERT
  WITH CHECK (auth.uid() = created_by AND public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update workspace brands"
  ON public.brands FOR UPDATE
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete workspace brands"
  ON public.brands FOR DELETE
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Auto-update updated_at
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
