import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CreditCard,
  MessageSquare,
  Mail,
  MapPin,
  Cloud,
  Webhook,
  Settings,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Plus,
} from "lucide-react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  type: string;
  category: "payment" | "sms" | "email" | "maps" | "storage" | "webhook";
  config: Record<string, any>;
  is_enabled: boolean;
  status: "connected" | "disconnected" | "error";
  created_at: string;
}

export default function Integrations() {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("platform_admin_token");
    if (!token) {
      navigate("/platform/login");
      return;
    }
    fetchIntegrations();
  }, [navigate]);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("platform_integrations")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  const toggleIntegration = async (id: string) => {
    try {
      const integration = integrations.find(i => i.id === id);
      if (!integration) return;

      const newStatus = integration.status === "connected" ? "disconnected" : "connected";
      const newEnabled = newStatus === "connected";

      const { error } = await supabase
        .from("platform_integrations")
        .update({ status: newStatus, is_enabled: newEnabled })
        .eq("id", id);

      if (error) throw error;

      setIntegrations(prev =>
        prev.map(int =>
          int.id === id
            ? { ...int, status: newStatus, is_enabled: newEnabled }
            : int
        )
      );
      toast.success("Integration status updated");
    } catch (error) {
      console.error("Failed to toggle integration:", error);
      toast.error("Failed to update integration");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "payment":
        return <CreditCard className="h-5 w-5" />;
      case "sms":
        return <MessageSquare className="h-5 w-5" />;
      case "email":
        return <Mail className="h-5 w-5" />;
      case "maps":
        return <MapPin className="h-5 w-5" />;
      case "storage":
        return <Cloud className="h-5 w-5" />;
      case "webhook":
        return <Webhook className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500">Connected</Badge>;
      case "disconnected":
        return <Badge variant="outline">Disconnected</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const categories = [
    { key: "payment", label: "Payment Gateways" },
    { key: "sms", label: "SMS Providers" },
    { key: "email", label: "Email Services" },
    { key: "maps", label: "Maps & Location" },
    { key: "storage", label: "Storage" },
    { key: "webhook", label: "Webhooks" },
  ];

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground">
              Connect third-party services to the platform
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{integrations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {integrations.filter(i => i.status === "connected").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disconnected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {integrations.filter(i => i.status === "disconnected").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrations by Category */}
        {categories.map((category) => {
          const categoryIntegrations = integrations.filter(i => i.category === category.key);
          if (categoryIntegrations.length === 0) return null;

          return (
            <Card key={category.key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(category.key)}
                  {category.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryIntegrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {getCategoryIcon(integration.category)}
                        </div>
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {integration.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(integration.status)}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedIntegration(integration)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {getCategoryIcon(integration.category)}
                                {integration.name}
                              </DialogTitle>
                              <DialogDescription>
                                Configure {integration.name} integration settings
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="flex items-center justify-between">
                                <Label>Enable Integration</Label>
                                <Switch
                                  checked={integration.status === "connected"}
                                  onCheckedChange={() => toggleIntegration(integration.id)}
                                />
                              </div>
                              {integration.category === "payment" && (
                                <>
                                  <div className="space-y-2">
                                    <Label>API Key</Label>
                                    <Input type="password" placeholder="Enter API key" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Secret Key</Label>
                                    <Input type="password" placeholder="Enter secret key" />
                                  </div>
                                </>
                              )}
                              {integration.category === "sms" && (
                                <>
                                  <div className="space-y-2">
                                    <Label>Account SID</Label>
                                    <Input placeholder="Enter account SID" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Auth Token</Label>
                                    <Input type="password" placeholder="Enter auth token" />
                                  </div>
                                </>
                              )}
                              {integration.category === "email" && (
                                <div className="space-y-2">
                                  <Label>API Key</Label>
                                  <Input type="password" placeholder="Enter API key" />
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button variant="outline">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Documentation
                              </Button>
                              <Button className="bg-blue-600 hover:bg-blue-700">
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PlatformLayout>
  );
}
