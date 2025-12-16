import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Flag,
  Plus,
  Search,
  Settings,
  ToggleLeft,
  ToggleRight,
  Users,
  Building2,
  Globe,
  Percent,
  Edit,
  Trash2,
} from "lucide-react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  target_type: "all" | "percentage" | "tenants" | "users";
  target_value: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export default function FeatureFlags() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({
    key: "",
    name: "",
    description: "",
    targetType: "all",
  });

  useEffect(() => {
    const token = localStorage.getItem("platform_admin_token");
    if (!token) {
      navigate("/platform/login");
      return;
    }
    fetchFlags();
  }, [navigate]);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("platform_feature_flags")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error("Failed to fetch feature flags:", error);
      toast.error("Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (id: string) => {
    try {
      const flag = flags.find(f => f.id === id);
      if (!flag) return;

      const { error } = await supabase
        .from("platform_feature_flags")
        .update({ is_enabled: !flag.is_enabled })
        .eq("id", id);

      if (error) throw error;

      setFlags(prev =>
        prev.map(f =>
          f.id === id ? { ...f, is_enabled: !f.is_enabled, updated_at: new Date().toISOString() } : f
        )
      );
      toast.success("Feature flag updated");
    } catch (error) {
      console.error("Failed to toggle flag:", error);
      toast.error("Failed to update feature flag");
    }
  };

  const createFlag = async () => {
    try {
      const { error } = await supabase.from("platform_feature_flags").insert({
        key: newFlag.key,
        name: newFlag.name,
        description: newFlag.description,
        is_enabled: false,
        target_type: newFlag.targetType,
        target_value: {},
      });

      if (error) throw error;

      setIsCreateDialogOpen(false);
      setNewFlag({ key: "", name: "", description: "", targetType: "all" });
      toast.success("Feature flag created");
      fetchFlags();
    } catch (error) {
      console.error("Failed to create flag:", error);
      toast.error("Failed to create feature flag");
    }
  };

  const getTargetBadge = (flag: FeatureFlag) => {
    switch (flag.target_type) {
      case "all":
        return <Badge variant="outline"><Globe className="h-3 w-3 mr-1" />All</Badge>;
      case "percentage":
        return <Badge variant="outline"><Percent className="h-3 w-3 mr-1" />{flag.target_value?.percentage || 100}%</Badge>;
      case "tenants":
        return <Badge variant="outline"><Building2 className="h-3 w-3 mr-1" />Tenants</Badge>;
      case "users":
        return <Badge variant="outline"><Users className="h-3 w-3 mr-1" />Users</Badge>;
      default:
        return <Badge variant="outline">{flag.target_type}</Badge>;
    }
  };

  const filteredFlags = flags.filter(flag =>
    flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flag.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: flags.length,
    enabled: flags.filter(f => f.is_enabled).length,
    disabled: flags.filter(f => !f.is_enabled).length,
  };

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
            <p className="text-muted-foreground">
              Control feature rollouts across the platform
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Flag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>
                  Add a new feature flag to control feature rollouts
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Flag Key</Label>
                  <Input
                    placeholder="e.g., new_feature"
                    value={newFlag.key}
                    onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  />
                  <p className="text-xs text-muted-foreground">Unique identifier used in code</p>
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    placeholder="e.g., New Feature"
                    value={newFlag.name}
                    onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe what this feature does..."
                    value={newFlag.description}
                    onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Type</Label>
                  <Select
                    value={newFlag.targetType}
                    onValueChange={(value) => setNewFlag({ ...newFlag, targetType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="percentage">Percentage Rollout</SelectItem>
                      <SelectItem value="tenants">Specific Tenants</SelectItem>
                      <SelectItem value="users">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createFlag} className="bg-blue-600 hover:bg-blue-700">
                  Create Flag
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enabled</CardTitle>
              <ToggleRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.enabled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disabled</CardTitle>
              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.disabled}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feature flags..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Flags Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flag</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{flag.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {flag.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{flag.key}</code>
                    </TableCell>
                    <TableCell>{getTargetBadge(flag)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={flag.is_enabled}
                        onCheckedChange={() => toggleFlag(flag.id)}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(flag.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
}
