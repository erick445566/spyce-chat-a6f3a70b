import { useState } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Megaphone,
  Users,
  Loader2,
  Send,
  Settings,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  useChannels,
  useMyChannels,
  useChannelMessages,
  useCreateChannel,
  useSubscribeChannel,
  useUnsubscribeChannel,
  usePostChannelMessage,
  useDeleteChannel,
} from "@/hooks/useChannels";
import { useIsOwner, useIsAdmin } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ChannelsViewProps {
  onBack: () => void;
}

const ChannelsView = ({ onBack }: ChannelsViewProps) => {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [copied, setCopied] = useState(false);
  
  const { data: channels = [], isLoading } = useChannels();
  const { data: myChannels = [] } = useMyChannels();
  const { data: messages = [] } = useChannelMessages(selectedChannel?.id);
  const { data: isOwner } = useIsOwner();
  const { data: isAdmin } = useIsAdmin();
  const createChannel = useCreateChannel();
  const subscribe = useSubscribeChannel();
  const unsubscribe = useUnsubscribeChannel();
  const postMessage = usePostChannelMessage();
  const deleteChannel = useDeleteChannel();
  const { toast } = useToast();

  const canCreateChannel = isOwner || isAdmin;

  const handleCreate = () => {
    if (!newChannelName.trim()) return;
    createChannel.mutate({
      name: newChannelName.trim(),
      description: newChannelDesc.trim() || undefined,
    }, {
      onSuccess: () => {
        setNewChannelName("");
        setNewChannelDesc("");
        setShowCreate(false);
      },
    });
  };

  const handlePost = () => {
    if (!newMessage.trim() || !selectedChannel) return;
    postMessage.mutate({
      channelId: selectedChannel.id,
      content: newMessage.trim(),
    }, {
      onSuccess: () => setNewMessage(""),
    });
  };

  const handleCopyLink = () => {
    if (!selectedChannel?.invite_code) return;
    const link = `${window.location.origin}/invite/channel/${selectedChannel.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copiado!" });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  if (selectedChannel) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Channel Header */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSelectedChannel(null)} 
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">{selectedChannel.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedChannel.subscriber_count} inscritos
            </p>
          </div>
          {selectedChannel.isOwner && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-destructive"
                onClick={() => {
                  deleteChannel.mutate(selectedChannel.id);
                  setSelectedChannel(null);
                }}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedChannel.description && (
            <div className="bg-secondary/50 rounded-2xl p-4 text-sm text-muted-foreground">
              {selectedChannel.description}
            </div>
          )}
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {selectedChannel.isOwner 
                  ? "Publique a primeira mensagem do canal" 
                  : "Nenhuma publicação ainda"}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="bg-secondary rounded-2xl p-4">
                {msg.content && <p>{msg.content}</p>}
                {msg.media_url && (
                  <img src={msg.media_url} alt="" className="rounded-xl mt-2 max-w-full" />
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {formatTime(msg.created_at)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Post Input (Owner only) */}
        {selectedChannel.isOwner && (
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Escreva uma publicação..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePost()}
              />
              <Button
                variant="spyce"
                size="icon"
                onClick={handlePost}
                disabled={!newMessage.trim() || postMessage.isPending}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Subscribe Button */}
        {!selectedChannel.isOwner && (
          <div className="p-4 border-t border-border">
            {selectedChannel.isSubscribed ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => unsubscribe.mutate(selectedChannel.id)}
                disabled={unsubscribe.isPending}
              >
                Cancelar inscrição
              </Button>
            ) : (
              <Button
                variant="spyce"
                className="w-full"
                onClick={() => subscribe.mutate(selectedChannel.id)}
                disabled={subscribe.isPending}
              >
                Inscrever-se
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Canais</h2>
        </div>
        {canCreateChannel && (
          <Button
            variant="spyce"
            size="icon"
            className="rounded-xl"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* My Channels */}
      {myChannels.length > 0 && (
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Meus Canais</h3>
          <div className="space-y-2">
            {myChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel({ ...channel, isOwner: true, isSubscribed: true })}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl spyce-gradient flex items-center justify-center text-white">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{channel.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {channel.subscriber_count} inscritos
                  </p>
                </div>
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Channels */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Descobrir Canais</h3>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : channels.filter(c => !c.isOwner).length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum canal disponível</p>
          </div>
        ) : (
          <div className="space-y-2">
            {channels.filter(c => !c.isOwner).map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{channel.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {channel.subscriber_count} inscritos
                  </p>
                </div>
                {channel.isSubscribed && (
                  <span className="text-xs text-primary font-medium">Inscrito</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Canal</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do Canal</label>
              <Input
                placeholder="Ex: Notícias, Atualizações..."
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Descrição (opcional)</label>
              <Textarea
                placeholder="Sobre o que é este canal?"
                value={newChannelDesc}
                onChange={(e) => setNewChannelDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button
              variant="spyce"
              onClick={handleCreate}
              disabled={!newChannelName.trim() || createChannel.isPending}
            >
              {createChannel.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Criar Canal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChannelsView;
