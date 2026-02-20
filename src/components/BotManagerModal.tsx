import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  useBotTokens,
  useCreateBotToken,
  useDeleteBotToken,
  useToggleBotToken,
  useBotAutoReplies,
  useCreateAutoReply,
  useDeleteAutoReply,
  useToggleAutoReply,
} from "@/hooks/useBots";
import {
  Bot,
  Plus,
  Trash2,
  Copy,
  QrCode,
  Key,
  Loader2,
  MessageSquare,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BotManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BotManagerModal = ({ open, onOpenChange }: BotManagerModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Bots & Automações
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="external" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="external" className="gap-1.5">
              <Key className="w-4 h-4" />
              API Externa
            </TabsTrigger>
            <TabsTrigger value="auto-reply" className="gap-1.5">
              <MessageSquare className="w-4 h-4" />
              Auto-Resposta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="external" className="mt-4">
            <ExternalBotsTab />
          </TabsContent>

          <TabsContent value="auto-reply" className="mt-4">
            <AutoReplyTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const ExternalBotsTab = () => {
  const { data: tokens, isLoading } = useBotTokens();
  const createToken = useCreateBotToken();
  const deleteToken = useDeleteBotToken();
  const toggleToken = useToggleBotToken();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [showQR, setShowQR] = useState<string | null>(null);
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());

  const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bot-api`;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createToken.mutateAsync(newName.trim());
      setNewName("");
      toast({ title: "Token criado!", description: "Use o QR Code ou pairing code para conectar." });
    } catch {
      toast({ variant: "destructive", title: "Erro ao criar token" });
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  };

  const toggleVisible = (id: string) => {
    setVisibleTokens((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create new token */}
      <div className="flex gap-2">
        <Input
          placeholder="Nome do bot (ex: MeuBot)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button
          onClick={handleCreate}
          disabled={!newName.trim() || createToken.isPending}
          size="icon"
        >
          {createToken.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Tokens list */}
      {tokens?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum bot conectado ainda.</p>
          <p className="text-xs mt-1">Crie um token para conectar bots externos.</p>
        </div>
      )}

      {tokens?.map((token) => (
        <div
          key={token.id}
          className="rounded-xl border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${token.is_active ? "text-green-500" : "text-muted-foreground"}`} />
              <span className="font-medium">{token.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={token.is_active}
                onCheckedChange={(v) => toggleToken.mutate({ id: token.id, is_active: v })}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteToken.mutate(token.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Token */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Token API</label>
            <div className="flex items-center gap-1">
              <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded-lg font-mono truncate">
                {visibleTokens.has(token.id)
                  ? token.token
                  : "••••••••••••••••••••••••"}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => toggleVisible(token.id)}
              >
                {visibleTokens.has(token.id) ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleCopy(token.token, "Token")}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Pairing Code */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Pairing Code</label>
            <div className="flex items-center gap-1">
              <code className="flex-1 text-sm bg-muted px-2 py-1.5 rounded-lg font-mono tracking-widest text-center font-bold">
                {token.pairing_code}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleCopy(token.pairing_code || "", "Pairing code")}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* QR Code button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => setShowQR(showQR === token.id ? null : token.id)}
          >
            <QrCode className="w-4 h-4" />
            {showQR === token.id ? "Fechar QR Code" : "Mostrar QR Code"}
          </Button>

          {showQR === token.id && (
            <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl">
              <QRCodeSVG
                value={JSON.stringify({
                  api_url: apiBaseUrl,
                  token: token.token,
                  name: token.name,
                })}
                size={200}
                level="M"
                includeMargin
              />
              <p className="text-xs text-gray-500 text-center">
                Escaneie com seu bot para conectar
              </p>
            </div>
          )}

          {/* Last used */}
          {token.last_used_at && (
            <p className="text-xs text-muted-foreground">
              Último uso: {new Date(token.last_used_at).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      ))}

      {/* API Docs hint */}
      {tokens && tokens.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/50 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">📡 Endpoints da API</p>
          <div className="space-y-1 text-xs font-mono text-muted-foreground">
            <p>GET /conversations</p>
            <p>GET /messages?conversation_id=xxx</p>
            <p>POST /send {"{"} conversation_id, content {"}"}</p>
            <p>POST /pair {"{"} pairing_code {"}"}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => handleCopy(apiBaseUrl, "URL da API")}
          >
            <Copy className="w-3 h-3 mr-1" />
            Copiar URL da API
          </Button>
        </div>
      )}
    </div>
  );
};

const AutoReplyTab = () => {
  const { data: rules, isLoading } = useBotAutoReplies();
  const createRule = useCreateAutoReply();
  const deleteRule = useDeleteAutoReply();
  const toggleRule = useToggleAutoReply();
  const { toast } = useToast();

  const [keyword, setKeyword] = useState("");
  const [response, setResponse] = useState("");
  const [matchType, setMatchType] = useState("contains");

  const handleCreate = async () => {
    if (!keyword.trim() || !response.trim()) return;
    try {
      await createRule.mutateAsync({
        trigger_keyword: keyword.trim(),
        response_text: response.trim(),
        match_type: matchType,
      });
      setKeyword("");
      setResponse("");
      toast({ title: "Regra criada!" });
    } catch {
      toast({ variant: "destructive", title: "Erro ao criar regra" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create rule form */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">Nova regra de auto-resposta</p>

        <Select value={matchType} onValueChange={setMatchType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contains">Contém</SelectItem>
            <SelectItem value="exact">Exato</SelectItem>
            <SelectItem value="starts_with">Começa com</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Palavra-chave (ex: oi, ajuda, preço)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <Input
          placeholder="Resposta automática"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
        />

        <Button
          onClick={handleCreate}
          disabled={!keyword.trim() || !response.trim() || createRule.isPending}
          className="w-full gap-2"
        >
          {createRule.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Adicionar regra
        </Button>
      </div>

      {/* Rules list */}
      {rules?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma regra de auto-resposta.</p>
          <p className="text-xs mt-1">
            Crie regras para responder automaticamente a mensagens.
          </p>
        </div>
      )}

      {rules?.map((rule) => (
        <div
          key={rule.id}
          className="rounded-xl border border-border bg-card p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${rule.is_active ? "text-green-500" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium">
                {rule.match_type === "exact" ? "=" : rule.match_type === "starts_with" ? "^" : "∋"}{" "}
                <code className="bg-muted px-1 rounded text-xs">{rule.trigger_keyword}</code>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Switch
                checked={rule.is_active}
                onCheckedChange={(v) => toggleRule.mutate({ id: rule.id, is_active: v })}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => deleteRule.mutate(rule.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pl-6">→ {rule.response_text}</p>
        </div>
      ))}
    </div>
  );
};

export default BotManagerModal;
