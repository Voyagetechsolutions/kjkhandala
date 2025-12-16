import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Send,
  Plus,
  Bell,
  Mail,
  MessageSquare,
  Users,
  Clock,
  CheckCircle2,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Info,
  Megaphone,
} from "lucide-react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "update" | "maintenance" | "warning" | "critical";
  channels: string[];
  status: "draft" | "scheduled" | "sent" | "cancelled";
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  created_at: string;
}

export default function Announcements() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantCount, setTenantCount] = useState(0);

  useEffect(() => {
    // Check if platform admin is logged in
    const token = localStorage.getItem("platform_admin_token");
    if (!token) {
      navigate("/platform/login");
      return;
    }
    fetchAnnouncements();
  }, [navigate]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const [{ data: announcementsData }, { count: tenantsCount }] = await Promise.all([
        supabase
          .from("platform_announcements")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("companies")
          .select("*", { count: "exact", head: true }),
      ]);

      setAnnouncements(announcementsData || []);
      setTenantCount(tenantsCount || 0);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    type: "info",
    target: "all",
    channels: ["email", "in-app"],
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "maintenance":
        return <Badge className="bg-orange-500">Maintenance</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case "update":
        return <Badge className="bg-green-500">Update</Badge>;
      case "info":
        return <Badge className="bg-blue-500">Info</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="outline" className="text-green-600">Sent</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="text-blue-600">Scheduled</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSend = async () => {
    try {
      const { error } = await supabase.from("platform_announcements").insert({
        title: newAnnouncement.title,
        content: newAnnouncement.message,
        type: newAnnouncement.type,
        channels: newAnnouncement.channels,
        status: "sent",
        sent_at: new Date().toISOString(),
        recipient_count: tenantCount,
      });

      if (error) throw error;

      toast.success("Announcement sent successfully");
      setIsCreateDialogOpen(false);
      setNewAnnouncement({
        title: "",
        message: "",
        type: "info",
        target: "all",
        channels: ["email", "in-app"],
      });
      fetchAnnouncements();
    } catch (error) {
      console.error("Failed to send announcement:", error);
      toast.error("Failed to send announcement");
    }
  };

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground">
              Send system-wide messages to all tenants
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
                <DialogDescription>
                  Send a message to all or selected tenants
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Announcement title"
                    value={newAnnouncement.title}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Write your announcement..."
                    rows={5}
                    value={newAnnouncement.message}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, message: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newAnnouncement.type}
                      onValueChange={(value) =>
                        setNewAnnouncement({ ...newAnnouncement, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-500" />
                            Information
                          </div>
                        </SelectItem>
                        <SelectItem value="update">
                          <div className="flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-green-500" />
                            Product Update
                          </div>
                        </SelectItem>
                        <SelectItem value="warning">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Warning
                          </div>
                        </SelectItem>
                        <SelectItem value="maintenance">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            Maintenance
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select
                      value={newAnnouncement.target}
                      onValueChange={(value) =>
                        setNewAnnouncement({ ...newAnnouncement, target: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tenants</SelectItem>
                        <SelectItem value="specific">Specific Tenants</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Delivery Channels</Label>
                  <div className="flex gap-4">
                    {[
                      { id: "email", label: "Email", icon: Mail },
                      { id: "in-app", label: "In-App", icon: Bell },
                      { id: "sms", label: "SMS", icon: MessageSquare },
                    ].map((channel) => (
                      <label
                        key={channel.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newAnnouncement.channels.includes(channel.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewAnnouncement({
                                ...newAnnouncement,
                                channels: [...newAnnouncement.channels, channel.id],
                              });
                            } else {
                              setNewAnnouncement({
                                ...newAnnouncement,
                                channels: newAnnouncement.channels.filter((c) => c !== channel.id),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <channel.icon className="h-4 w-4" />
                        {channel.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Save as Draft
                </Button>
                <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {announcements.filter((a) => a.status === "sent").length}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {announcements.filter((a) => a.status === "scheduled").length}
              </div>
              <p className="text-xs text-muted-foreground">Pending delivery</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">27</div>
              <p className="text-xs text-muted-foreground">Active tenants</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {announcements.filter((a) => a.status === "draft").length}
              </div>
              <p className="text-xs text-muted-foreground">Unpublished</p>
            </CardContent>
          </Card>
        </div>

        {/* Announcements Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
            <CardDescription>View and manage all platform announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{announcement.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {announcement.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(announcement.type)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {announcement.channels?.map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(announcement.status)}</TableCell>
                    <TableCell>{announcement.recipient_count}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {announcement.sent_at
                        ? new Date(announcement.sent_at).toLocaleDateString()
                        : announcement.scheduled_at
                        ? `Scheduled: ${new Date(announcement.scheduled_at).toLocaleDateString()}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {announcement.status === "draft" && (
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
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
