import { useState } from "react";
import { 
  Shield, 
  Crown, 
  Ban, 
  Users, 
  ArrowLeft, 
  Search,
  Loader2,
  UserX,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  useIsOwner, 
  useIsAdmin, 
  useAllUsers, 
  useBans,
  useBanUser,
  useUnbanUser,
  useSetUserRole,
} from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AdminPanelProps {
  onBack: () => void;
}

type Tab = "users" | "bans";

const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const [tab, setTab] = useState<Tab>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [newRole, setNewRole] = useState("");
  
  const { data: isOwner } = useIsOwner();
  const { data: isAdmin } = useIsAdmin();
  const { data: users = [], isLoading: loadingUsers } = useAllUsers();
  const { data: bans = [], isLoading: loadingBans } = useBans();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const setUserRole = useSetUserRole();

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBan = () => {
    if (!selectedUser) return;
    banUser.mutate({
      userId: selectedUser.id,
      reason: banReason,
      isPermanent: true,
    }, {
      onSuccess: () => {
        setShowBanModal(false);
        setBanReason("");
        setSelectedUser(null);
      },
    });
  };

  const handleUnban = (banId: string) => {
    unbanUser.mutate(banId);
  };

  const handleRoleChange = () => {
    if (!selectedUser || !newRole) return;
    setUserRole.mutate({
      userId: selectedUser.id,
      role: newRole,
    }, {
      onSuccess: () => {
        setShowRoleModal(false);
        setNewRole("");
        setSelectedUser(null);
      },
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-medium flex items-center gap-1">
            <Crown className="w-3 h-3" /> Dono
          </span>
        );
      case "admin":
        return (
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center gap-1">
            <Shield className="w-3 h-3" /> Admin
          </span>
        );
      case "moderator":
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 text-xs font-medium">
            Moderador
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            Membro
          </span>
        );
    }
  };

  if (!isOwner && !isAdmin) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Administração</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta área.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <Crown className="w-5 h-5 text-yellow-500" />
          ) : (
            <Shield className="w-5 h-5 text-primary" />
          )}
          <h2 className="text-lg font-semibold">
            {isOwner ? "Painel do Dono" : "Painel Admin"}
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("users")}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors",
            tab === "users" 
              ? "border-b-2 border-primary text-primary" 
              : "text-muted-foreground"
          )}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Usuários
        </button>
        <button
          onClick={() => setTab("bans")}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors",
            tab === "bans" 
              ? "border-b-2 border-primary text-primary" 
              : "text-muted-foreground"
          )}
        >
          <Ban className="w-4 h-4 inline mr-2" />
          Banimentos
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-secondary border-0"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2">
        {tab === "users" ? (
          loadingUsers ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl spyce-gradient flex items-center justify-center text-white font-semibold">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    user.display_name?.charAt(0) || user.username.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">
                      {user.display_name || user.username}
                    </span>
                    {getRoleBadge(user.role || "member")}
                  </div>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
                <div className="flex gap-1">
                  {isOwner && user.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl"
                      onClick={() => {
                        setSelectedUser(user);
                        setNewRole(user.role || "member");
                        setShowRoleModal(true);
                      }}
                    >
                      <Shield className="w-4 h-4" />
                    </Button>
                  )}
                  {user.role !== "owner" && user.role !== "admin" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl text-destructive"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowBanModal(true);
                      }}
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )
        ) : (
          loadingBans ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : bans.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum usuário banido</p>
            </div>
          ) : (
            bans.map((ban) => (
              <div
                key={ban.id}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-destructive/20 flex items-center justify-center text-destructive">
                  <Ban className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold truncate block">
                    {ban.user?.display_name || ban.user?.username || "Usuário"}
                  </span>
                  <p className="text-sm text-muted-foreground truncate">
                    {ban.reason || "Sem motivo especificado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Por: {ban.banned_by_user?.display_name || ban.banned_by_user?.username}
                  </p>
                </div>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnban(ban.id)}
                    disabled={unbanUser.isPending}
                  >
                    Desbanir
                  </Button>
                )}
              </div>
            ))
          )
        )}
      </div>

      {/* Ban Modal */}
      <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir Usuário</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Tem certeza que deseja banir{" "}
              <strong>{selectedUser?.display_name || selectedUser?.username}</strong>?
            </p>
            <Textarea
              placeholder="Motivo do banimento (opcional)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBan}
              disabled={banUser.isPending}
            >
              {banUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Banir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Cargo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Alterar cargo de{" "}
              <strong>{selectedUser?.display_name || selectedUser?.username}</strong>
            </p>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membro</SelectItem>
                <SelectItem value="moderator">Moderador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRoleChange}
              disabled={setUserRole.isPending}
            >
              {setUserRole.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
