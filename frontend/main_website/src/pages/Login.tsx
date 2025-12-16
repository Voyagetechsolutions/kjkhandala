import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const getDashboardRoute = (userRoles: string[]) => {
  if (!userRoles || userRoles.length === 0) {
    return "/admin"; // Default to admin for staff
  }
  
  const role = userRoles[0];
  
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/admin";
    case "OPERATIONS_MANAGER":
      return "/operations";
    case "FINANCE_MANAGER":
      return "/finance";
    case "HR_MANAGER":
      return "/hr";
    case "MAINTENANCE_MANAGER":
      return "/maintenance";
    case "TICKETING_AGENT":
    case "TICKETING_SUPERVISOR":
      return "/ticketing";
    case "DRIVER":
      return "/driver";
    case "PASSENGER":
    default:
      return "/admin"; // Staff portal defaults to admin
  }
};

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const { signIn, user, userRoles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user && userRoles.length > 0) {
      const dashboardRoute = getDashboardRoute(userRoles);
      navigate(dashboardRoute, { replace: true });
    }
  }, [user, userRoles, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);

      if (error) throw new Error(error);

      // Fetch roles directly from database after successful login
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .eq('is_active', true);
        
        const roles = rolesData?.map(r => r.role) || [];
        const dashboardRoute = getDashboardRoute(roles);
        
        toast({
          title: "Welcome back!",
          description: "Redirecting to your dashboard...",
        });
        
        navigate(dashboardRoute, { replace: true });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-0">
        {/* Company Branding */}
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <img 
            src="/logo.png" 
            alt="Company Logo" 
            className="h-20 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">KJ Khandala</h1>
            <p className="text-sm text-gray-500 mt-1">Staff Portal</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-center mb-2">Sign In</h2>
          <p className="text-muted-foreground text-center text-sm">
            Enter your credentials to access the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-orange-600 hover:bg-orange-700" 
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* Powered By */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-xs text-gray-400">
            Powered by
          </p>
          <p className="text-center text-sm font-medium text-orange-600 mt-1">
            Voyage Technology Solutions
          </p>
        </div>
      </Card>
    </div>
  );
}
