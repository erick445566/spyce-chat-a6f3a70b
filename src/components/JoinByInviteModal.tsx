import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useJoinCommunityByInvite, useJoinGroupByInvite } from "@/hooks/useInvites";

interface JoinByInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (id: string, type: "community" | "group") => void;
}

const JoinByInviteModal = ({
  open,
  onOpenChange,
  onSuccess,
}: JoinByInviteModalProps) => {
  const { toast } = useToast();
  const [inviteLink, setInviteLink] = useState("");

  const joinCommunity = useJoinCommunityByInvite();
  const joinGroup = useJoinGroupByInvite();

  const isJoining = joinCommunity.isPending || joinGroup.isPending;

  const parseInviteLink = (link: string): { type: "community" | "group"; code: string } | null => {
    // Handle full URLs like https://spyce-chat.lovable.app/invite/community/ABC123
    const urlMatch = link.match(/\/invite\/(community|group)\/([A-Za-z0-9]+)/);
    if (urlMatch) {
      return {
        type: urlMatch[1] as "community" | "group",
        code: urlMatch[2],
      };
    }

    // Handle just the code (assume it could be either, try both)
    const codeMatch = link.match(/^[A-Za-z0-9]{8}$/);
    if (codeMatch) {
      return { type: "group", code: link }; // Default to group, will try both
    }

    return null;
  };

  const handleJoin = async () => {
    const parsed = parseInviteLink(inviteLink.trim());
    
    if (!parsed) {
      toast({
        variant: "destructive",
        title: "Link inválido",
        description: "Por favor, insira um link de convite válido.",
      });
      return;
    }

    try {
      let resultId: string;
      let resultType: "community" | "group";

      if (parsed.type === "community") {
        resultId = await joinCommunity.mutateAsync(parsed.code);
        resultType = "community";
        toast({
          title: "Sucesso!",
          description: "Você entrou na comunidade.",
        });
      } else {
        // Try group first, then community
        try {
          resultId = await joinGroup.mutateAsync(parsed.code);
          resultType = "group";
          toast({
            title: "Sucesso!",
            description: "Você entrou no grupo.",
          });
        } catch {
          // If group fails, try community
          resultId = await joinCommunity.mutateAsync(parsed.code);
          resultType = "community";
          toast({
            title: "Sucesso!",
            description: "Você entrou na comunidade.",
          });
        }
      }

      setInviteLink("");
      onOpenChange(false);
      onSuccess?.(resultId, resultType);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível entrar. O convite pode ser inválido ou expirado.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Entrar por convite
          </DialogTitle>
          <DialogDescription>
            Cole o link de convite que você recebeu para entrar em um grupo ou comunidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="https://spyce-chat.lovable.app/invite/..."
            value={inviteLink}
            onChange={(e) => setInviteLink(e.target.value)}
            disabled={isJoining}
          />

          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={!inviteLink.trim() || isJoining}
          >
            {isJoining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinByInviteModal;
