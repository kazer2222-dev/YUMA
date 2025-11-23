import { useState } from "react";
import {
  Users,
  Search,
  UserPlus,
  MoreVertical,
  Mail,
  Shield,
  Eye,
  Crown,
  Trash2,
  Settings,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "admin" | "member" | "viewer";
  joinedDate: string;
  lastActive: string;
}

interface SpaceMembersProps {
  spaceId: string;
  spaceName: string;
}

export function SpaceMembers({ spaceId, spaceName }: SpaceMembersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");

  // Mock members data
  const [members, setMembers] = useState<Member[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      role: "admin",
      joinedDate: "Jan 15, 2024",
      lastActive: "2 minutes ago",
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "michael.chen@company.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      role: "admin",
      joinedDate: "Jan 15, 2024",
      lastActive: "1 hour ago",
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      email: "emily.rodriguez@company.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
      role: "member",
      joinedDate: "Jan 20, 2024",
      lastActive: "5 hours ago",
    },
    {
      id: "4",
      name: "James Wilson",
      email: "james.wilson@company.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
      role: "member",
      joinedDate: "Feb 1, 2024",
      lastActive: "1 day ago",
    },
    {
      id: "5",
      name: "Lisa Anderson",
      email: "lisa.anderson@company.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
      role: "viewer",
      joinedDate: "Feb 5, 2024",
      lastActive: "3 days ago",
    },
    {
      id: "6",
      name: "David Kim",
      email: "david.kim@company.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      role: "member",
      joinedDate: "Feb 10, 2024",
      lastActive: "12 hours ago",
    },
  ]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "member":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "viewer":
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "member":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "viewer":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "";
    }
  };

  const handleInviteMember = () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }

    // Mock invite logic
    toast.success(`Invitation sent to ${inviteEmail}`);
    setShowInviteDialog(false);
    setInviteEmail("");
    setInviteRole("member");
  };

  const handleChangeRole = (memberId: string, newRole: "admin" | "member" | "viewer") => {
    setMembers(
      members.map((member) =>
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );
    toast.success("Member role updated");
  };

  const handleRemoveMember = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    setMembers(members.filter((m) => m.id !== memberId));
    toast.success(`${member?.name} removed from space`);
  };

  // Filter members based on search and role
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const memberStats = {
    total: members.length,
    admins: members.filter((m) => m.role === "admin").length,
    members: members.filter((m) => m.role === "member").length,
    viewers: members.filter((m) => m.role === "viewer").length,
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-2xl">People</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Manage members and permissions for {spaceName}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Invite People
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Total Members</p>
                <p className="text-2xl mt-1">{memberStats.total}</p>
              </div>
              <Users className="w-8 h-8 text-[var(--muted-foreground)]" />
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Admins</p>
                <p className="text-2xl mt-1">{memberStats.admins}</p>
              </div>
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Members</p>
                <p className="text-2xl mt-1">{memberStats.members}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Viewers</p>
                <p className="text-2xl mt-1">{memberStats.viewers}</p>
              </div>
              <Eye className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[var(--muted)]/50 border-b border-[var(--border)]">
            <div className="col-span-4 text-sm text-[var(--muted-foreground)]">
              Member
            </div>
            <div className="col-span-2 text-sm text-[var(--muted-foreground)]">
              Role
            </div>
            <div className="col-span-2 text-sm text-[var(--muted-foreground)]">
              Joined
            </div>
            <div className="col-span-3 text-sm text-[var(--muted-foreground)]">
              Last Active
            </div>
            <div className="col-span-1 text-sm text-[var(--muted-foreground)]">
              
            </div>
          </div>

          {/* Members Rows */}
          <div className="divide-y divide-[var(--border)]">
            {filteredMembers.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]" />
                <p className="text-[var(--muted-foreground)]">
                  No members found
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/30 transition-colors"
                >
                  {/* Member Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate">{member.name}</p>
                      <p className="text-sm text-[var(--muted-foreground)] truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="col-span-2 flex items-center">
                    <Badge
                      variant="outline"
                      className={`gap-1.5 ${getRoleBadgeColor(member.role)}`}
                    >
                      {getRoleIcon(member.role)}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </div>

                  {/* Joined Date */}
                  <div className="col-span-2 flex items-center text-sm text-[var(--muted-foreground)]">
                    {member.joinedDate}
                  </div>

                  {/* Last Active */}
                  <div className="col-span-3 flex items-center text-sm text-[var(--muted-foreground)]">
                    {member.lastActive}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() =>
                            window.location.href = `mailto:${member.email}`
                          }
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(member.id, "admin")}
                          disabled={member.role === "admin"}
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(member.id, "member")}
                          disabled={member.role === "member"}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(member.id, "viewer")}
                          disabled={member.role === "viewer"}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Make Viewer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove from Space
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Role Descriptions */}
        <div className="mt-6 bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4" />
            Role Permissions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span>Admin</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Full access to manage space settings, members, and all content
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>Member</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Can create, edit, and delete tasks and collaborate with the team
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <span>Viewer</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Read-only access to view tasks and space content
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite People to {spaceName}</DialogTitle>
            <DialogDescription>
              Send an invitation to join this space. They will receive an email with
              instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm">
                Role
              </label>
              <Select
                value={inviteRole}
                onValueChange={(value: any) => setInviteRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <div>
                        <div>Admin</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <div>
                        <div>Member</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <div>
                        <div>Viewer</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Role Description */}
              <div className="mt-2 p-3 bg-[var(--muted)]/50 rounded-md">
                <p className="text-sm text-[var(--muted-foreground)]">
                  {inviteRole === "admin" && (
                    <span>
                      <strong className="text-[var(--foreground)]">Admin:</strong> Full access to manage space settings, members, and all content
                    </span>
                  )}
                  {inviteRole === "member" && (
                    <span>
                      <strong className="text-[var(--foreground)]">Member:</strong> Can create, edit, and delete tasks and collaborate with the team
                    </span>
                  )}
                  {inviteRole === "viewer" && (
                    <span>
                      <strong className="text-[var(--foreground)]">Viewer:</strong> Read-only access to view tasks and space content
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}