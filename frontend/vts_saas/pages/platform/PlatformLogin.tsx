import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Loader2, Shield, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function PlatformLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid credentials. Please check your email and password.");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if user is a platform admin (DEVELOPER role)
        const { data: platformAdmin } = await supabase
          .from("platform_admins")
          .select("id, role, permissions, is_active")
          .eq("user_id", data.user.id)
          .eq("is_active", true)
          .single();

        // Also check user_roles for DEVELOPER role
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "DEVELOPER")
          .eq("is_active", true)
          .single();

        if (!platformAdmin && !userRole) {
          // User is not a platform admin
          await supabase.auth.signOut();
          toast.error("You are not authorized to access the platform dashboard. Contact system administrator.");
          setLoading(false);
          return;
        }

        // Store platform admin session
        localStorage.setItem("platform_admin_token", btoa(JSON.stringify({ 
          email, 
          userId: data.user.id,
          role: platformAdmin?.role || "DEVELOPER",
          permissions: platformAdmin?.permissions || {},
          timestamp: Date.now() 
        })));
        localStorage.setItem("platform_admin_email", email);
        
        // Update last login
        if (platformAdmin) {
          await supabase
            .from("platform_admins")
            .update({ last_login_at: new Date().toISOString() })
            .eq("user_id", data.user.id);
        }
        
        toast.success("Welcome to VTS Platform Admin");
        navigate("/platform");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI0MmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2aC00djJoNHYtMnptMC02aC00djJoNHYtMnptLTYgNmgtNHYyaDR2LTJ6bTAtNmgtNHYyaDR2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />

      <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
            <Code2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">VTS Platform Admin</CardTitle>
          <CardDescription>
            Developer Dashboard - SaaS Management Console
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@voyagetech.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Access Platform
            </Button>
          </form>

          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Restricted Access</p>
                <p className="text-amber-700 mt-1">
                  This dashboard is for platform administrators only. 
                  Unauthorized access attempts are logged.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>© 2024 Voyage Tech Solutions</p>
            <p className="mt-1">Platform Version 2.1.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
