import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Bus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(8, "Phone number is required").max(20),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Helper function to get dashboard route based on user role
const getDashboardRoute = (user: any) => {
  if (!user) return "/";
  
  const role = user.role || user.userRoles?.[0]?.role;
  
  switch (role) {
    case "SUPER_ADMIN":
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
      return "/ticketing";
    case "DRIVER":
      return "/driver";
    default:
      return "/"; // Passenger/customer goes to homepage
  }
};

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: ""
  });
  
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const validated = signUpSchema.parse(formData);
        const { error } = await signUp(
          validated.email,
          validated.password,
          validated.fullName,
          validated.phone
        );

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        setIsSignUp(false);
      } else {
        const validated = signInSchema.parse({
          email: formData.email,
          password: formData.password
        });
        const { error, user: loggedInUser } = await signIn(validated.email, validated.password);

        if (error) throw error;

        console.log('Logged in user:', loggedInUser);
        console.log('User role:', loggedInUser?.role);
        console.log('User userRoles:', loggedInUser?.userRoles);

        // Redirect to role-specific dashboard
        const dashboardRoute = getDashboardRoute(loggedInUser);
        console.log('Dashboard route:', dashboardRoute);
        
        toast({
          title: "Welcome back!",
          description: `Redirecting to ${dashboardRoute}...`,
        });
        
        navigate(dashboardRoute);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Bus className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Voyage Bus</h1>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-muted-foreground">
            {isSignUp ? "Sign up to book your journey" : "Sign in to continue"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  maxLength={20}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary hover:underline"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </Card>
    </div>
  );
}