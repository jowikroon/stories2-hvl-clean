
-- Table to store generated content
CREATE TABLE public.generated_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_features TEXT[],
  target_audience TEXT,
  brand_voice TEXT,
  marketplace TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own content"
  ON public.generated_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content"
  ON public.generated_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content"
  ON public.generated_content FOR DELETE
  USING (auth.uid() = user_id);

-- Table to track publications
CREATE TABLE public.publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.generated_content(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own publications"
  ON public.publications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own publications"
  ON public.publications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own publications"
  ON public.publications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own publications"
  ON public.publications FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON public.publications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
