-- Add workspace_id to generated_content
ALTER TABLE public.generated_content
  ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to publications
ALTER TABLE public.publications
  ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Helper: check if user is a member of a workspace (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

-- Drop old policies on generated_content
DROP POLICY IF EXISTS "Users can view their own content" ON public.generated_content;
DROP POLICY IF EXISTS "Users can insert their own content" ON public.generated_content;
DROP POLICY IF EXISTS "Users can delete their own content" ON public.generated_content;

-- New workspace-scoped policies on generated_content
CREATE POLICY "Members can view workspace content"
  ON public.generated_content FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert workspace content"
  ON public.generated_content FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete workspace content"
  ON public.generated_content FOR DELETE
  USING (auth.uid() = user_id AND public.is_workspace_member(auth.uid(), workspace_id));

-- Drop old policies on publications
DROP POLICY IF EXISTS "Users can view their own publications" ON public.publications;
DROP POLICY IF EXISTS "Users can insert their own publications" ON public.publications;
DROP POLICY IF EXISTS "Users can update their own publications" ON public.publications;
DROP POLICY IF EXISTS "Users can delete their own publications" ON public.publications;

-- New workspace-scoped policies on publications
CREATE POLICY "Members can view workspace publications"
  ON public.publications FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert workspace publications"
  ON public.publications FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update workspace publications"
  ON public.publications FOR UPDATE
  USING (auth.uid() = user_id AND public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete workspace publications"
  ON public.publications FOR DELETE
  USING (auth.uid() = user_id AND public.is_workspace_member(auth.uid(), workspace_id));