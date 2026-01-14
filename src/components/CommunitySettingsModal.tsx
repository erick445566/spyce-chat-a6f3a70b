import { useState } from "react";
import { 
  X, 
  Globe, 
  Lock,
  Shield, 
  UserPlus, 
  Search, 
  MoreVertical,
  Crown,
  VolumeX,
  Volume2,
  UserMinus,
  Loader2,
  ShieldCheck,
  LogOut,
  Trash2,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useCommunityMembers, 
  useUserCommunityRole,
  useAddCommunityMember,
  useRemoveCommunityMember,
  useUpdateCommunityMemberRole,
  useMuteCommunityMember,
  useLeaveCommunity,
  useDeleteCommunity
} from "@/hooks/useCommunities";
import { useSearchUsers } from "@/hooks/useProfile";
import { CommunityWithDetails, Profile, AppRole } from "@/types/chat";
import { addDays, addHours } from "date-fns";

interface CommunitySettingsModalProps {
  community: CommunityWithDetails;
  onClose: () => void;
}

const CommunitySettingsModal = ({ community, onClose }: CommunitySettingsModalProps) => {
  const [view, setView] = useState<"main" | "add-member">("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { user } = useAuth();
  const { data: members = [], isLoading: loadingMembers } = useCommunityMembers(community.id);
  const { data: userRole } = useUserCommunityRole(community.id);
  const { data: searchResults = [], isLoading: searchingUsers } = useSearchUsers(searchQuery);
  
  const addMember = useAddCommunityMember();
  const removeMember = useRemoveCommunityMember();
  const updateRole = useUpdateCommunityMemberRole();
  const muteMember = useMuteCommunityMember();
  const leaveCommunity = useLeaveCommunity();
  const deleteCommunity = useDeleteCommunity();

  const isAdmin = userRole === "admin";
  const isModerator = userRole === "moderator" || isAdmin;

  const existingMemberIds = members.map((m) => m.user_id);
  const filteredSearchResults = searchResults.filter(
    (u) => !existingMemberIds.includes(u.id)
  );

  const handleAddMember = async (targetUser: Profile) => {
    try {
      await addMember.mutateAsync({
        communityId: community.id,
        userId: targetUser.id,
      });
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember.mutateAsync({
        communityId: community.id,
        userId,
      });
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const handleUpdateRole = async (userId: string, role: AppRole) => {
    try {
      await updateRole.mutateAsync({
        communityId: community.id,
        userId,
        role,
      });
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleMute = async (userId: string, duration: "1h" | "24h" | "7d" | "forever" | "unmute") => {
    try {
      let mutedUntil: string | null = null;
      
      if (duration !== "unmute") {
        const now = new Date();
        switch (duration) {
          case "1h":
            mutedUntil = addHours(now, 1).toISOString();
            break;
          case "24h":
            mutedUntil = addHours(now, 24).toISOString();
            break;
          case "7d":
            mutedUntil = addDays(now, 7).toISOString();
            break;
          case "forever":
            mutedUntil = addDays(now, 365 * 100).toISOString();
            break;
        }
      }

      await muteMember.mutateAsync({
        communityId: community.id,
        userId,
        mutedUntil,
      });
    } catch (error) {
      console.error("Error muting member:", error);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveCommunity.mutateAsync(community.id);
      onClose();
    } catch (error) {
      console.error("Error leaving community:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCommunity.mutateAsync(community.id);
      onClose();
    } catch (error) {
      console.error("Error deleting community:", error);
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "moderator":
        return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (view === "add-member") {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("main")}
            className="rounded-xl"
          >
            <X className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Adicionar Membro</h2>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-secondary border-0"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {searchingUsers ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : searchQuery && filteredSearchResults.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum usuário encontrado
            </p>
          ) : (
            filteredSearchResults.map((targetUser) => (
              <button
                key={targetUser.id}
                onClick={() => handleAddMember(targetUser)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors"
                disabled={addMember.isPending}
              >
                <div className="w-12 h-12 rounded-2xl spyce-gradient flex items-center justify-center text-white font-semibold">
                  {targetUser.display_name?.charAt(0) || targetUser.username.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{targetUser.display_name || targetUser.username}</p>
                  <p className="text-sm text-muted-foreground">@{targetUser.username}</p>
                </div>
                {addMember.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-xl"
        >
          <X className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold flex-1">{community.name}</h2>
      </div>

      {/* Community Info */}
      <div className="p-6 flex flex-col items-center border-b border-border">
        <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center mb-3">
          {community.is_public ? (
            <Globe className="w-10 h-10 text-muted-foreground" />
          ) : (
            <Lock className="w-10 h-10 text-muted-foreground" />
          )}
        </div>
        <h3 className="text-xl font-bold">{community.name}</h3>
        {community.description && (
          <p className="text-sm text-muted-foreground text-center mt-1">{community.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">{members.length} membros</p>
      </div>

      {/* Actions */}
      <div className="p-4 border-b border-border space-y-2">
        {isModerator && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setView("add-member")}
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Membro
          </Button>
        )}
        
        {!isAdmin && (
          <Button
            variant="outline"
            className="w-full gap-2 text-destructive hover:text-destructive"
            onClick={() => setShowLeaveDialog(true)}
          >
            <LogOut className="w-4 h-4" />
            Sair da Comunidade
          </Button>
        )}
        
        {isAdmin && (
          <Button
            variant="outline"
            className="w-full gap-2 text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4" />
            Excluir Comunidade
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-2">
          <h4 className="text-sm font-medium text-muted-foreground">Membros</h4>
        </div>
        
        {loadingMembers ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="px-2">
            {members.map((member) => {
              const isCurrentUser = member.user_id === user?.id;
              const profile = member.profile;
              const memberRole = member.role;
              const isMuted = member.is_muted;

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/50"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl spyce-gradient flex items-center justify-center text-white font-semibold">
                      {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || "?"}
                    </div>
                    {isMuted && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                        <VolumeX className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">
                        {profile?.display_name || profile?.username}
                        {isCurrentUser && " (você)"}
                      </p>
                      {getRoleIcon(memberRole)}
                    </div>
                    <p className="text-sm text-muted-foreground">@{profile?.username}</p>
                  </div>
                  
                  {isModerator && !isCurrentUser && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isAdmin && (
                          <>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.user_id, memberRole === "admin" ? "member" : "admin")}>
                              <Crown className="w-4 h-4 mr-2" />
                              {memberRole === "admin" ? "Remover Admin" : "Tornar Admin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.user_id, memberRole === "moderator" ? "member" : "moderator")}>
                              <ShieldCheck className="w-4 h-4 mr-2" />
                              {memberRole === "moderator" ? "Remover Moderador" : "Tornar Moderador"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        
                        {isMuted ? (
                          <DropdownMenuItem onClick={() => handleMute(member.user_id, "unmute")}>
                            <Volume2 className="w-4 h-4 mr-2" />
                            Desmutar
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => handleMute(member.user_id, "1h")}>
                              <VolumeX className="w-4 h-4 mr-2" />
                              Mutar por 1 hora
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMute(member.user_id, "24h")}>
                              <VolumeX className="w-4 h-4 mr-2" />
                              Mutar por 24 horas
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMute(member.user_id, "7d")}>
                              <VolumeX className="w-4 h-4 mr-2" />
                              Mutar por 7 dias
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMute(member.user_id, "forever")}>
                              <VolumeX className="w-4 h-4 mr-2" />
                              Mutar permanentemente
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Remover da Comunidade
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leave Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da comunidade?</AlertDialogTitle>
            <AlertDialogDescription>
              Você não receberá mais atualizações desta comunidade. Você pode entrar novamente se for uma comunidade pública.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {leaveCommunity.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sair"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comunidade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os membros serão removidos e a comunidade será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteCommunity.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommunitySettingsModal;
