import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Link2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useJoinCommunityByInvite, useJoinGroupByInvite } from "@/hooks/useInvites";

const InvitePage = () => {
  const { type, code } = useParams<{ type: string; code: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [resultId, setResultId] = useState<string | null>(null);

  const joinCommunity = useJoinCommunityByInvite();
  const joinGroup = useJoinGroupByInvite();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      // Store the invite URL and redirect to login
      sessionStorage.setItem("pendingInvite", window.location.pathname);
      navigate("/");
      return;
    }

    if (!type || !code) {
      setStatus("error");
      setErrorMessage("Link de convite inválido.");
      return;
    }

    const handleJoin = async () => {
      setStatus("loading");
      
      try {
        let id: string;
        
        if (type === "community") {
          id = await joinCommunity.mutateAsync(code);
        } else if (type === "group") {
          id = await joinGroup.mutateAsync(code);
        } else {
          throw new Error("Tipo de convite inválido");
        }
        
        setResultId(id);
        setStatus("success");
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error.message || "Convite inválido ou expirado.");
      }
    };

    handleJoin();
  }, [user, authLoading, type, code]);

  const handleContinue = () => {
    if (type === "group" && resultId) {
      navigate(`/?chat=${resultId}`);
    } else {
      navigate("/");
    }
  };

  if (authLoading || status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-20 h-20 rounded-3xl spyce-gradient flex items-center justify-center mb-6 shadow-spyce-lg">
          <Link2 className="w-10 h-10 text-white" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Processando convite...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mb-6">
          <XCircle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Erro no convite</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">{errorMessage}</p>
        <Button onClick={() => navigate("/")}>Voltar ao início</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-green-500/10 flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Você entrou!</h1>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {type === "community"
          ? "Você agora faz parte desta comunidade."
          : "Você agora faz parte deste grupo."}
      </p>
      <Button onClick={handleContinue} variant="spyce">
        Continuar para o chat
      </Button>
    </div>
  );
};

export default InvitePage;
