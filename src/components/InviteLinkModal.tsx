import { useState } from "react";
import { Copy, Check, Link2, Loader2, Share2 } from "lucide-react";
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
import { useGenerateCommunityInvite, useGenerateGroupInvite } from "@/hooks/useInvites";

interface InviteLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "community" | "group";
  targetId: string;
  targetName: string;
  existingInviteCode?: string | null;
}

const InviteLinkModal = ({
  open,
  onOpenChange,
  type,
  targetId,
  targetName,
  existingInviteCode,
}: InviteLinkModalProps) => {
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState<string | null>(existingInviteCode || null);
  const [copied, setCopied] = useState(false);

  const generateCommunityInvite = useGenerateCommunityInvite();
  const generateGroupInvite = useGenerateGroupInvite();

  const isGenerating = generateCommunityInvite.isPending || generateGroupInvite.isPending;

  const handleGenerateLink = async () => {
    try {
      let code: string | undefined;
      if (type === "community") {
        code = await generateCommunityInvite.mutateAsync(targetId);
      } else {
        code = await generateGroupInvite.mutateAsync(targetId);
      }
      setInviteCode(code || null);
      toast({
        title: "Link gerado!",
        description: "Compartilhe o link para convidar pessoas.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o link de convite.",
      });
    }
  };

  const getInviteUrl = () => {
    if (!inviteCode) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/invite/${type}/${inviteCode}`;
  };

  const handleCopy = async () => {
    const url = getInviteUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copiado!",
        description: "Link copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível copiar o link.",
      });
    }
  };

  const handleShare = async () => {
    const url = getInviteUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Entrar em ${targetName}`,
          text: `Use este link para entrar em ${targetName} no Spyce Chat`,
          url: url,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Link de convite
          </DialogTitle>
          <DialogDescription>
            Compartilhe este link para que outras pessoas possam entrar em{" "}
            <span className="font-medium">{targetName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {inviteCode ? (
            <>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={getInviteUrl()}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGenerateLink}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Gerar novo"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                Gere um link de convite para compartilhar
              </p>
              <Button onClick={handleGenerateLink} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Gerar link de convite
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteLinkModal;
