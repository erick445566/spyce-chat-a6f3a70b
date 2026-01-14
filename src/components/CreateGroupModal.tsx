import { useState } from "react";
import { X, Search, Users, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSearchUsers } from "@/hooks/useProfile";
import { useCreateGroup } from "@/hooks/useGroups";
import { Profile } from "@/types/chat";
import { cn } from "@/lib/utils";

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: (conversationId: string) => void;
}

const CreateGroupModal = ({ onClose, onSuccess }: CreateGroupModalProps) => {
  const [step, setStep] = useState<"info" | "members">("info");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([]);

  const { data: searchResults = [], isLoading: searchingUsers } = useSearchUsers(searchQuery);
  const createGroup = useCreateGroup();

  const handleToggleMember = (user: Profile) => {
    if (selectedMembers.find((m) => m.id === user.id)) {
      setSelectedMembers((prev) => prev.filter((m) => m.id !== user.id));
    } else {
      setSelectedMembers((prev) => [...prev, user]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedMembers.length === 0) return;

    try {
      const result = await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        participantIds: selectedMembers.map((m) => m.id),
      });
      onSuccess(result.id);
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  return (
    <div className="absolute inset-0 bg-background z-50 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={step === "members" ? () => setStep("info") : onClose}
          className="rounded-xl"
        >
          <X className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold flex-1">
          {step === "info" ? "Novo Grupo" : "Adicionar Membros"}
        </h2>
        {step === "info" && name.trim() && (
          <Button
            variant="ghost"
            onClick={() => setStep("members")}
            className="text-primary"
          >
            Próximo
          </Button>
        )}
        {step === "members" && selectedMembers.length > 0 && (
          <Button
            variant="ghost"
            onClick={handleCreate}
            disabled={createGroup.isPending}
            className="text-primary"
          >
            {createGroup.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Criar"
            )}
          </Button>
        )}
      </div>

      {step === "info" ? (
        <div className="flex-1 p-4 space-y-4">
          {/* Group Avatar */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>

          {/* Group Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do Grupo</label>
            <Input
              placeholder="Digite o nome do grupo"
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
              placeholder="Descreva o propósito do grupo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-0 resize-none"
              rows={3}
              maxLength={200}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div className="p-4 border-b border-border">
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleToggleMember(member)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-sm"
                  >
                    <span>{member.display_name || member.username}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
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

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto px-2">
            {searchingUsers ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery && searchResults.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </p>
            ) : (
              searchResults.map((user) => {
                const isSelected = selectedMembers.some((m) => m.id === user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => handleToggleMember(user)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl transition-colors",
                      isSelected ? "bg-accent" : "hover:bg-secondary"
                    )}
                  >
                    <div className="w-12 h-12 rounded-2xl spyce-gradient flex items-center justify-center text-white font-semibold">
                      {user.display_name?.charAt(0) || user.username.charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">{user.display_name || user.username}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full spyce-gradient flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateGroupModal;
