-- Allow workspace creators to also read the workspaces they created
CREATE POLICY "Creators can view their own workspaces"
  ON public.workspaces FOR SELECT
  USING (created_by = auth.uid());