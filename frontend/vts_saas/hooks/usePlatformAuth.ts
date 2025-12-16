import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PlatformAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  userId: string | null;
  role: string | null;
  permissions: Record<string, any> | null;
}

export function usePlatformAuth() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<PlatformAuthState>({
    isAuthenticated: false,
    isLoading: true,
    email: null,
    userId: null,
    role: null,
    permissions: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      // Check localStorage token
      const token = localStorage.getItem("platform_admin_token");
      if (!token) {
        setAuthState({ isAuthenticated: false, isLoading: false, email: null, userId: null, role: null, permissions: null });
        navigate("/platform/login");
        return;
      }

      // Verify Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Clear local storage and redirect
        localStorage.removeItem("platform_admin_token");
        localStorage.removeItem("platform_admin_email");
        toast.error("Session expired. Please log in again.");
        setAuthState({ isAuthenticated: false, isLoading: false, email: null, userId: null, role: null, permissions: null });
        navigate("/platform/login");
        return;
      }

      // Check if user is a platform admin from database
      const { data: platformAdmin } = await supabase
        .from("platform_admins")
        .select("id, role, permissions, is_active")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .single();

      // Also check user_roles for DEVELOPER role
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "DEVELOPER")
        .eq("is_active", true)
        .single();

      if (!platformAdmin && !userRole) {
        toast.error("You are not authorized to access the platform admin.");
        await supabase.auth.signOut();
        localStorage.removeItem("platform_admin_token");
        localStorage.removeItem("platform_admin_email");
        setAuthState({ isAuthenticated: false, isLoading: false, email: null, userId: null, role: null, permissions: null });
        navigate("/platform/login");
        return;
      }

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        email: session.user.email || null,
        userId: session.user.id,
        role: platformAdmin?.role || "DEVELOPER",
        permissions: platformAdmin?.permissions || null,
      });
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem("platform_admin_token");
        localStorage.removeItem("platform_admin_email");
        setAuthState({ isAuthenticated: false, isLoading: false, email: null, userId: null, role: null, permissions: null });
        navigate("/platform/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("platform_admin_token");
    localStorage.removeItem("platform_admin_email");
    toast.success("Logged out successfully");
    navigate("/platform/login");
  };

  return { ...authState, logout };
}
