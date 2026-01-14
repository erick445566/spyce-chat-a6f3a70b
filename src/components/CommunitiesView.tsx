import { useState } from "react";
import { 
  Search, 
  Plus, 
  Users, 
  Globe,
  Lock,
  Crown,
  X,
  Loader2,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCommunities, useCreateCommunity, usePublicCommunities, useJoinCommunity } from "@/hooks/useCommunities";
import { CommunityWithDetails } from "@/types/chat";
import CommunitySettingsModal from "./CommunitySettingsModal";

interface CommunitiesViewProps {
  onBack: () => void;
}

const CommunitiesView = ({ onBack }: CommunitiesViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [publicSearchQuery, setPublicSearchQuery] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityWithDetails | null>(null);
  
  const { data: communities = [], isLoading } = useCommunities();
  const { data: publicCommunities = [], isLoading: searchingPublic } = usePublicCommunities(publicSearchQuery);
  const joinCommunity = useJoinCommunity();

  const filteredCommunities = communities.filter((comm) => {
    if (!searchQuery.trim()) return true;
    return comm.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleJoinCommunity = async (communityId: string) => {
    try {
      await joinCommunity.mutateAsync(communityId);
      setShowSearch(false);
      setPublicSearchQuery("");
    } catch (error) {
      console.error("Error joining community:", error);
    }
  };

  if (selectedCommunity) {
    return (
      <CommunitySettingsModal
        community={selectedCommunity}
        onClose={() => setSelectedCommunity(null)}
      />
    );
  }

  if (showCreateCommunity) {
    return (
      <CreateCommunityView
        onClose={() => setShowCreateCommunity(false)}
        onSuccess={() => setShowCreateCommunity(false)}
      />
    );
  }

  if (showSearch) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowSearch(false);
              setPublicSearchQuery("");
            }}
            className="rounded-xl"
          >
            <X className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Buscar Comunidades</h2>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar comunidades públicas..."
              value={publicSearchQuery}
              onChange={(e) => setPublicSearchQuery(e.target.value)}
              className="pl-12 bg-secondary border-0"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {searchingPublic ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : publicSearchQuery.length < 2 ? (
            <p className="text-center text-muted-foreground py-8">
              Digite pelo menos 2 caracteres para buscar
            </p>
          ) : publicCommunities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma comunidade encontrada
            </p>
          ) : (
            publicCommunities.map((community) => (
              <button
                key={community.id}
                onClick={() => handleJoinCommunity(community.id)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors"
                disabled={joinCommunity.isPending}
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                  <Globe className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{community.name}</p>
                  {community.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{community.description}</p>
                  )}
                </div>
                {joinCommunity.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-xl"
            >
              <X className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Comunidades</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(true)}
            className="rounded-xl"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar suas comunidades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-secondary border-0"
          />
        </div>
      </div>

      {/* Communities List */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Nenhuma comunidade encontrada" : "Você ainda não faz parte de nenhuma comunidade"}
            </p>
            <Button
              variant="outline"
              onClick={() => setShowCreateCommunity(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Comunidade
            </Button>
          </div>
        ) : (
          filteredCommunities.map((community) => (
            <CommunityItem
              key={community.id}
              community={community}
              onClick={() => setSelectedCommunity(community)}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <div className="absolute bottom-6 right-6">
        <Button
          variant="spyce"
          size="icon"
          className="w-14 h-14 rounded-2xl"
          onClick={() => setShowCreateCommunity(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

const CommunityItem = ({
  community,
  onClick,
}: {
  community: CommunityWithDetails;
  onClick: () => void;
}) => {
  const userRole = community.members.find((m) => m.role === "admin");
  const isAdmin = community.members.some((m) => m.role === "admin");

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-all duration-200 mb-1"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {community.avatar_url ? (
          <img
            src={community.avatar_url}
            alt={community.name}
            className="w-12 h-12 rounded-2xl object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
            {community.is_public ? (
              <Globe className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold truncate">{community.name}</span>
          {isAdmin && <Crown className="w-4 h-4 text-yellow-500" />}
        </div>
        <span className="text-sm text-muted-foreground">
          {community.memberCount} membros
        </span>
      </div>

      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );
};

const CreateCommunityView = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const createCommunity = useCreateCommunity();

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      await createCommunity.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating community:", error);
    }
  };

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
        <h2 className="text-lg font-semibold flex-1">Nova Comunidade</h2>
        {name.trim() && (
          <Button
            variant="ghost"
            onClick={handleCreate}
            disabled={createCommunity.isPending}
            className="text-primary"
          >
            {createCommunity.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Criar"
            )}
          </Button>
        )}
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Community Avatar */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center">
            {isPublic ? (
              <Globe className="w-10 h-10 text-muted-foreground" />
            ) : (
              <Lock className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Community Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome da Comunidade</label>
          <Input
            placeholder="Digite o nome da comunidade"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-secondary border-0"
            maxLength={50}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Descrição (opcional)</label>
          <Textarea
            placeholder="Descreva o propósito da comunidade"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-secondary border-0 resize-none"
            rows={3}
            maxLength={500}
          />
        </div>

        {/* Public/Private */}
        <div className="flex items-center justify-between p-4 bg-secondary rounded-2xl">
          <div className="flex items-center gap-3">
            {isPublic ? (
              <Globe className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <Label className="font-medium">
                {isPublic ? "Comunidade Pública" : "Comunidade Privada"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isPublic 
                  ? "Qualquer pessoa pode encontrar e entrar" 
                  : "Apenas convidados podem entrar"}
              </p>
            </div>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
        </div>
      </div>
    </div>
  );
};

export default CommunitiesView;
