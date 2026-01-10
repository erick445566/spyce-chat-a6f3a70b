import { useState } from "react";
import {
  ArrowLeft,
  User,
  Bell,
  Lock,
  Palette,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Shield,
  Eye,
  EyeOff,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SettingsProps {
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Settings = ({ onBack, isDarkMode, onToggleDarkMode }: SettingsProps) => {
  const [hideOnlineStatus, setHideOnlineStatus] = useState(false);
  const [hideReadReceipts, setHideReadReceipts] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);

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
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border">
            <div className="w-16 h-16 rounded-2xl spyce-gradient flex items-center justify-center text-white text-2xl font-bold">
              U
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">Usuário Demo</h2>
              <p className="text-sm text-muted-foreground">@usuario_demo</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
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
            />
          </SettingsGroup>

          {/* Privacy */}
          <SettingsGroup title="Privacidade">
            <SettingsToggle
              icon={<Eye className="w-5 h-5" />}
              title="Ocultar status online"
              description="Ninguém verá quando você estiver online"
              checked={hideOnlineStatus}
              onCheckedChange={setHideOnlineStatus}
            />
            <SettingsToggle
              icon={<EyeOff className="w-5 h-5" />}
              title="Ocultar confirmação de leitura"
              description="As marcas azuis não serão mostradas"
              checked={hideReadReceipts}
              onCheckedChange={setHideReadReceipts}
            />
            <SettingsToggle
              icon={<Smartphone className="w-5 h-5" />}
              title="Bloqueio por biometria"
              description="Use impressão digital ou Face ID"
              checked={biometricLock}
              onCheckedChange={setBiometricLock}
            />
          </SettingsGroup>

          {/* Notifications */}
          <SettingsGroup title="Notificações">
            <SettingsToggle
              icon={<Bell className="w-5 h-5" />}
              title="Notificações"
              description="Receber alertas de novas mensagens"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </SettingsGroup>

          {/* Security */}
          <SettingsGroup title="Segurança">
            <SettingsItem
              icon={<Lock className="w-5 h-5" />}
              title="Alterar senha"
              description="Atualize sua senha de acesso"
            />
            <SettingsItem
              icon={<Shield className="w-5 h-5" />}
              title="Sessões ativas"
              description="Gerencie dispositivos conectados"
            />
          </SettingsGroup>

          {/* Help */}
          <SettingsGroup title="Ajuda">
            <SettingsItem
              icon={<HelpCircle className="w-5 h-5" />}
              title="Central de ajuda"
              description="Perguntas frequentes e suporte"
            />
          </SettingsGroup>

          {/* Logout */}
          <div className="pb-8">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-14"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center gap-4 p-4">
    <div className="text-primary">{icon}</div>
    <div className="flex-1">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export default Settings;
