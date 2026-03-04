import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";

export default function AppEntryPage() {
  const { workspaces, currentWorkspace, loading } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    const checkAndRedirect = async () => {
      // Check onboarding
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();

      if (profile && !profile.onboarding_completed) {
        navigate("/app/onboarding", { replace: true });
        return;
      }

      if (currentWorkspace) {
        navigate(`/app/workspace/${currentWorkspace.id}/overview`, { replace: true });
      } else if (workspaces.length > 0) {
        navigate(`/app/workspace/${workspaces[0].id}/overview`, { replace: true });
      } else {
        navigate("/app/workspaces", { replace: true });
      }
    };

    checkAndRedirect();
  }, [loading, workspaces, currentWorkspace, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
