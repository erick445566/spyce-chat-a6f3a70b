import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Lock,
  Palette,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Smartphone,
  Loader2,
  User,
  Headphones,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import EditProfileModal from "@/components/EditProfileModal";
import ThemePickerModal from "@/components/ThemePickerModal";
import BiometricLockModal from "@/components/BiometricLockModal";
import HelpCenterModal from "@/components/HelpCenterModal";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import SupportTicketsModal from "@/components/SupportTicketsModal";
import BotManagerModal from "@/components/BotManagerModal";

interface SettingsViewProps {
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  forceMobile?: boolean;
  onToggleForceMobile?: () => void;
}

const SettingsView = ({ onBack, isDarkMode, onToggleDarkMode, forceMobile, onToggleForceMobile }: SettingsViewProps) => {
  const { signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [loggingOut, setLoggingOut] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [supportTicketsOpen, setSupportTicketsOpen] = useState(false);
  const [botManagerOpen, setBotManagerOpen] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível sair da conta.",
      });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleToggleSetting = async (field: "hide_online_status" | "hide_read_receipts", value: boolean) => {
    try {
      await updateProfile.mutateAsync({ [field]: value });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a configuração.",
      });
    }
  };

  const handleThemeSelect = async (color: string | null) => {
    try {
      await updateProfile.mutateAsync({ theme_primary_color: color });
      toast({
        title: "Tema atualizado",
        description: "Seu tema foi alterado com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o tema.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Configurações</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Section */}
        <div className="p-4">
          <button
            onClick={() => setEditProfileOpen(true)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:bg-accent/50 transition-colors text-left"
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full spyce-gradient flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || "U"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg truncate">
                {profile?.display_name || profile?.username || "Usuário"}
              </h2>
              <p className="text-sm text-muted-foreground truncate">@{profile?.username}</p>
              {profile?.bio && (
                <p className="text-sm text-muted-foreground truncate mt-1">{profile.bio}</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </button>
        </div>

        {/* Settings Groups */}
        <div className="px-4 space-y-6">
          {/* Appearance */}
          <SettingsGroup title="Aparência">
            <SettingsToggle
              icon={isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              title="Modo escuro"
              description="Ativar tema escuro"
              checked={isDarkMode}
              onCheckedChange={onToggleDarkMode}
            />
            <SettingsItem
              icon={<Palette className="w-5 h-5" />}
              title="Tema personalizado"
              description="Escolha suas cores favoritas"
              onClick={() => setThemePickerOpen(true)}
            />
            {onToggleForceMobile && (
              <SettingsToggle
                icon={<Smartphone className="w-5 h-5" />}
                title="Layout mobile no desktop"
                description="Usar sempre o layout de celular"
                checked={forceMobile || false}
                onCheckedChange={onToggleForceMobile}
              />
            )}
          </SettingsGroup>

          {/* Privacy */}
          <SettingsGroup title="Privacidade">
            <SettingsToggle
              icon={<Eye className="w-5 h-5" />}
              title="Ocultar status online"
              description="Ninguém verá quando você estiver online"
              checked={profile?.hide_online_status || false}
              onCheckedChange={(value) => handleToggleSetting("hide_online_status", value)}
              loading={updateProfile.isPending}
            />
            <SettingsToggle
              icon={<EyeOff className="w-5 h-5" />}
              title="Ocultar confirmação de leitura"
              description="As marcas azuis não serão mostradas"
              checked={profile?.hide_read_receipts || false}
              onCheckedChange={(value) => handleToggleSetting("hide_read_receipts", value)}
              loading={updateProfile.isPending}
            />
            <SettingsItem
              icon={<Smartphone className="w-5 h-5" />}
              title="Bloqueio por biometria"
              description={profile?.biometric_enabled ? "Ativado" : "Use impressão digital ou Face ID"}
              onClick={() => setBiometricModalOpen(true)}
            />
          </SettingsGroup>

          {/* Bots */}
          <SettingsGroup title="Bots & Automações">
            <SettingsItem
              icon={<Bot className="w-5 h-5" />}
              title="Gerenciar bots"
              description="API externa, QR Code e auto-resposta"
              onClick={() => setBotManagerOpen(true)}
            />
          </SettingsGroup>

          {/* Notifications */}
          <SettingsGroup title="Notificações">
            <SettingsToggle
              icon={<Bell className="w-5 h-5" />}
              title="Notificações"
              description="Receber alertas de novas mensagens"
              checked={true}
              onCheckedChange={() => {}}
            />
          </SettingsGroup>

          {/* Security */}
          <SettingsGroup title="Segurança">
            <SettingsItem
              icon={<Lock className="w-5 h-5" />}
              title="Alterar senha"
              description="Atualize sua senha de acesso"
              onClick={() => setChangePasswordOpen(true)}
            />
          </SettingsGroup>

          {/* Help */}
          <SettingsGroup title="Ajuda">
            <SettingsItem
              icon={<HelpCircle className="w-5 h-5" />}
              title="Central de ajuda"
              description="Perguntas frequentes"
              onClick={() => setHelpCenterOpen(true)}
            />
            <SettingsItem
              icon={<Headphones className="w-5 h-5" />}
              title="Suporte com IA"
              description="Chat com SpyceAI e histórico de tickets"
              onClick={() => setSupportTicketsOpen(true)}
            />
          </SettingsGroup>

          {/* Logout */}
          <div className="pb-8">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-14"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5 mr-3" />
              )}
              Sair da conta
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal open={editProfileOpen} onOpenChange={setEditProfileOpen} />
      <ThemePickerModal
        open={themePickerOpen}
        onOpenChange={setThemePickerOpen}
        currentColor={profile?.theme_primary_color || null}
        onSelectColor={handleThemeSelect}
        title="Tema Global"
      />
      <BiometricLockModal open={biometricModalOpen} onOpenChange={setBiometricModalOpen} />
      <HelpCenterModal open={helpCenterOpen} onOpenChange={setHelpCenterOpen} />
      <ChangePasswordModal open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      <SupportTicketsModal open={supportTicketsOpen} onOpenChange={setSupportTicketsOpen} />
      <BotManagerModal open={botManagerOpen} onOpenChange={setBotManagerOpen} />
    </div>
  );
};

const SettingsGroup = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
      {title}
    </h3>
    <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
      {children}
    </div>
  </div>
);

const SettingsItem = ({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors text-left"
  >
    <div className="text-primary">{icon}</div>
    <div className="flex-1">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground" />
  </button>
);

const SettingsToggle = ({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  loading = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  loading?: boolean;
}) => (
  <div className="flex items-center gap-4 p-4">
    <div className="text-primary">{icon}</div>
    <div className="flex-1">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {loading ? (
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    ) : (
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    )}
  </div>
);

export default SettingsView;
