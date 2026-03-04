import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Workspace {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

interface WorkspaceContextValue {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
  refetch: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const STORAGE_KEY = "mg_last_workspace_id";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    const { data } = await supabase
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: true });
    const list = (data ?? []) as Workspace[];
    setWorkspaces(list);

    // Validate persisted ID
    if (currentId && !list.find((w) => w.id === currentId)) {
      const fallback = list[0]?.id ?? null;
      setCurrentId(fallback);
      if (fallback) localStorage.setItem(STORAGE_KEY, fallback);
      else localStorage.removeItem(STORAGE_KEY);
    } else if (!currentId && list.length > 0) {
      setCurrentId(list[0].id);
      localStorage.setItem(STORAGE_KEY, list[0].id);
    }
    setLoading(false);
  }, [currentId]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const switchWorkspace = useCallback((id: string) => {
    setCurrentId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const createWorkspace = useCallback(async (name: string): Promise<Workspace> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Insert workspace (RLS allows insert if created_by = auth.uid())
    const { data: ws, error } = await supabase
      .from("workspaces")
      .insert({ name, created_by: user.id })
      .select("id")
      .single();
    if (error) throw error;

    // Add creator as owner member (needed before we can SELECT the workspace back)
    const { error: memberErr } = await supabase.from("workspace_members").insert({
      workspace_id: ws.id,
      user_id: user.id,
      role: "owner",
    });
    if (memberErr) throw memberErr;

    // Now we can read it back via RLS
    const { data: fullWs, error: readErr } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", ws.id)
      .single();
    if (readErr) throw readErr;

    await fetchWorkspaces();
    switchWorkspace(fullWs.id);
    return fullWs as Workspace;
  }, [fetchWorkspaces, switchWorkspace]);

  const currentWorkspace = workspaces.find((w) => w.id === currentId) ?? null;

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, currentWorkspace, loading, switchWorkspace, createWorkspace, refetch: fetchWorkspaces }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
