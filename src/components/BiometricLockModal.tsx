import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Fingerprint, Smartphone, ShieldCheck, Loader2 } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

interface BiometricLockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BiometricLockModal = ({ open, onOpenChange }: BiometricLockModalProps) => {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [enabling, setEnabling] = useState(false);

  const isEnabled = profile?.biometric_enabled || false;

  const checkBiometricSupport = async (): Promise<boolean> => {
    // Check if Web Authentication API is available
    if (!window.PublicKeyCredential) {
      return false;
    }

    try {
      // Check if platform authenticator is available (fingerprint, face, etc.)
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  };

  const handleToggleBiometric = async () => {
    try {
      setEnabling(true);

      if (!isEnabled) {
        // Check if device supports biometrics
        const supported = await checkBiometricSupport();
        
        if (!supported) {
          toast({
            variant: "destructive",
            title: "Não suportado",
            description: "Seu dispositivo não suporta autenticação biométrica ou ela não está configurada.",
          });
          return;
        }

        // Simulate biometric authentication
        // In a real app, you would use the Web Authentication API here
        toast({
          title: "Biometria ativada",
          description: "O bloqueio biométrico foi habilitado.",
        });
      } else {
        toast({
          title: "Biometria desativada",
          description: "O bloqueio biométrico foi removido.",
        });
      }

      await updateProfile.mutateAsync({
        biometric_enabled: !isEnabled,
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar a configuração.",
      });
    } finally {
      setEnabling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-primary" />
            Bloqueio Biométrico
          </DialogTitle>
          <DialogDescription>
            Use sua impressão digital ou Face ID para desbloquear o app.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isEnabled 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
            }`}>
              {isEnabled ? (
                <ShieldCheck className="w-10 h-10" />
              ) : (
                <Smartphone className="w-10 h-10" />
              )}
            </div>

            <div>
              <p className="font-medium text-lg">
                {isEnabled ? "Bloqueio ativo" : "Bloqueio desativado"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isEnabled
                  ? "Suas conversas estão protegidas"
                  : "Ative para mais segurança"}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-xl">
            <h4 className="font-medium text-sm mb-2">Como funciona:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ao abrir o app, será solicitada sua biometria</li>
              <li>• Funciona com impressão digital ou Face ID</li>
              <li>• Protege suas conversas de acessos não autorizados</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          <Button
            className={`flex-1 ${isEnabled ? "bg-destructive hover:bg-destructive/90" : "spyce-gradient"}`}
            onClick={handleToggleBiometric}
            disabled={enabling || updateProfile.isPending}
          >
            {enabling || updateProfile.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEnabled ? (
              "Desativar"
            ) : (
              "Ativar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BiometricLockModal;
