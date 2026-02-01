import { useState } from "react";
import { 
  X, 
  Users, 
  Shield, 
  UserPlus, 
  Search, 
  MoreVertical,
  Crown,
  VolumeX,
  Volume2,
  UserMinus,
  Check,
  Loader2,
  ShieldCheck,
  User,
  Palette,
  Link,
  Copy
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
import { useAuth } from "@/contexts/AuthContext";
import { 
  useGroupMembers, 
  useUserGroupRole,
  useAddGroupMember,
  useRemoveGroupMember,
  useUpdateMemberRole,
  useMuteMember
} from "@/hooks/useGroups";
import { useSearchUsers } from "@/hooks/useProfile";
import { useUpdateConversationTheme } from "@/hooks/useChat";
import { useGenerateGroupInvite } from "@/hooks/useInvites";
import { Profile } from "@/types/chat";
import { cn } from "@/lib/utils";
import { addDays, addHours } from "date-fns";
import ThemePickerModal from "./ThemePickerModal";
import { useToast } from "@/hooks/use-toast";
import InviteLinkModal from "./InviteLinkModal";

interface GroupSettingsModalProps {
  conversationId: string;
  groupName: string;
  themeColor?: string | null;
  inviteCode?: string | null;
  onClose: () => void;
}

const GroupSettingsModal = ({ conversationId, groupName, themeColor, inviteCode, onClose }: GroupSettingsModalProps) => {
  const [view, setView] = useState<"main" | "add-member">("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: members = [], isLoading: loadingMembers } = useGroupMembers(conversationId);
  const { data: userRole } = useUserGroupRole(conversationId);
  const { data: searchResults = [], isLoading: searchingUsers } = useSearchUsers(searchQuery);
  
  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();
  const updateRole = useUpdateMemberRole();
  const muteMember = useMuteMember();
  const updateTheme = useUpdateConversationTheme();

  const isAdmin = userRole === "admin";
  const isModerator = userRole === "moderator" || isAdmin;

  const handleThemeSelect = async (color: string | null) => {
    try {
      await updateTheme.mutateAsync({
        conversationId,
        themeColor: color,
      });
      toast({
        title: "Tema atualizado",
        description: "O tema do grupo foi alterado.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o tema.",
      });
    }
  };

  const existingMemberIds = members.map((m) => m.user_id);
  const filteredSearchResults = searchResults.filter(
    (u) => !existingMemberIds.includes(u.id)
  );

  const handleAddMember = async (targetUser: Profile) => {
    try {
      await addMember.mutateAsync({
        conversationId,
        userId: targetUser.id,
      });
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember.mutateAsync({
        conversationId,
        userId,
      });
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await updateRole.mutateAsync({
        conversationId,
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
        conversationId,
        userId,
        mutedUntil,
      });
    } catch (error) {
      console.error("Error muting member:", error);
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
      <div className="absolute inset-0 bg-background z-50 flex flex-col animate-slide-up">
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
    <div className="absolute inset-0 bg-background z-50 flex flex-col animate-slide-up">
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
        <h2 className="text-lg font-semibold flex-1">{groupName}</h2>
      </div>

      {/* Group Info */}
      <div className="p-6 flex flex-col items-center border-b border-border">
        <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center mb-3">
          <Users className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold">{groupName}</h3>
        <p className="text-sm text-muted-foreground">{members.length} membros</p>
      </div>

      {/* Actions */}
      <div className="p-4 border-b border-border space-y-2">
        {isModerator && (
          <>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setView("add-member")}
            >
              <UserPlus className="w-4 h-4" />
              Adicionar Membro
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowInviteModal(true)}
            >
              <Link className="w-4 h-4" />
              Link de Convite
            </Button>
          </>
        )}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setThemePickerOpen(true)}
        >
          <Palette className="w-4 h-4" />
          Personalizar Tema
        </Button>
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
                          Remover do Grupo
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

      {/* Theme Picker Modal */}
      <ThemePickerModal
        open={themePickerOpen}
        onOpenChange={setThemePickerOpen}
        currentColor={themeColor || null}
        onSelectColor={handleThemeSelect}
        title="Tema do Grupo"
      />

      {/* Invite Link Modal */}
      <InviteLinkModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        existingInviteCode={inviteCode}
        type="group"
        targetId={conversationId}
        targetName={groupName}
      />
    </div>
  );
};

export default GroupSettingsModal;
