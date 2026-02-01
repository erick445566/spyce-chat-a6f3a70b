import { useState } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Eye, 
  X,
  Loader2,
  Image,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  useStatuses, 
  useMyStatuses,
  useCreateStatus,
  useDeleteStatus,
  useViewStatus,
  useStatusViews,
} from "@/hooks/useStatus";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StatusViewProps {
  onBack: () => void;
}

const StatusView = ({ onBack }: StatusViewProps) => {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showViewer, setShowViewer] = useState<string | null>(null);
  const [showViewers, setShowViewers] = useState<string | null>(null);
  const [content, setContent] = useState("");
  
  const { data: statuses = [], isLoading } = useStatuses();
  const { data: myStatuses = [] } = useMyStatuses();
  const { data: viewers = [] } = useStatusViews(showViewers);
  const createStatus = useCreateStatus();
  const deleteStatus = useDeleteStatus();
  const viewStatus = useViewStatus();

  // Group statuses by user
  const groupedStatuses = statuses.reduce((acc, status) => {
    const userId = status.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        user: status.user,
        statuses: [],
      };
    }
    acc[userId].statuses.push(status);
    return acc;
  }, {} as Record<string, { user: any; statuses: typeof statuses }>);

  const handleCreate = () => {
    if (!content.trim()) return;
    createStatus.mutate({ content: content.trim() }, {
      onSuccess: () => {
        setContent("");
        setShowCreate(false);
      },
    });
  };

  const handleView = (statusId: string) => {
    setShowViewer(statusId);
    viewStatus.mutate(statusId);
  };

  const currentViewingStatus = statuses.find(s => s.id === showViewer);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}min`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Status</h2>
        </div>
        <Button
          variant="spyce"
          size="icon"
          className="rounded-xl"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* My Status */}
      {myStatuses.length > 0 && (
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Meu Status</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {myStatuses.map((status) => (
              <button
                key={status.id}
                onClick={() => setShowViewers(status.id)}
                className="flex-shrink-0 relative"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent p-0.5">
                  <div className="w-full h-full rounded-[14px] bg-secondary flex items-center justify-center text-xs text-center p-2">
                    {status.content?.slice(0, 20) || "📷"}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full px-1.5 py-0.5 text-xs flex items-center gap-0.5">
                  <Eye className="w-3 h-3" />
                  {status.view_count}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Statuses */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Atualizações Recentes</h3>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(groupedStatuses).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Eye className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Nenhum status disponível</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowCreate(true)}
            >
              Publicar um status
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(groupedStatuses)
              .filter(([userId]) => userId !== user?.id)
              .map(([userId, { user: statusUser, statuses: userStatuses }]) => (
              <button
                key={userId}
                onClick={() => handleView(userStatuses[0].id)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent p-0.5">
                    <div className="w-full h-full rounded-full spyce-gradient flex items-center justify-center text-white font-semibold">
                      {statusUser?.avatar_url ? (
                        <img 
                          src={statusUser.avatar_url} 
                          alt="" 
                          className="w-full h-full rounded-full object-cover" 
                        />
                      ) : (
                        statusUser?.display_name?.charAt(0) || statusUser?.username?.charAt(0) || "?"
                      )}
                    </div>
                  </div>
                  {userStatuses.length > 1 && (
                    <span className="absolute -bottom-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {userStatuses.length}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">
                    {statusUser?.display_name || statusUser?.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(userStatuses[0].created_at)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Status Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Status</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Textarea
              placeholder="O que você está pensando?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Seu status será visível por 24 horas
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button 
              variant="spyce"
              onClick={handleCreate}
              disabled={!content.trim() || createStatus.isPending}
            >
              {createStatus.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publicar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Status Modal */}
      {showViewer && currentViewingStatus && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            onClick={() => setShowViewer(null)}
            className="absolute top-4 right-4 text-white p-2"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="absolute top-4 left-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full spyce-gradient flex items-center justify-center text-white font-semibold">
              {currentViewingStatus.user?.display_name?.charAt(0) || "?"}
            </div>
            <div className="text-white">
              <p className="font-semibold">{currentViewingStatus.user?.display_name}</p>
              <p className="text-sm text-white/70">
                {formatTime(currentViewingStatus.created_at)}
              </p>
            </div>
          </div>
          <div className="max-w-lg p-8 text-center">
            {currentViewingStatus.media_url ? (
              <img 
                src={currentViewingStatus.media_url} 
                alt="" 
                className="max-h-[70vh] rounded-2xl" 
              />
            ) : (
              <p className="text-2xl text-white">{currentViewingStatus.content}</p>
            )}
          </div>
        </div>
      )}

      {/* Viewers Modal */}
      <Dialog open={!!showViewers} onOpenChange={() => setShowViewers(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Visualizações
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {viewers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma visualização ainda
              </p>
            ) : (
              viewers.map((view) => (
                <div key={view.id} className="flex items-center gap-3 p-2">
                  <div className="w-10 h-10 rounded-full spyce-gradient flex items-center justify-center text-white font-semibold">
                    {view.viewer?.display_name?.charAt(0) || view.viewer?.username?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {view.viewer?.display_name || view.viewer?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(view.viewed_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (showViewers) {
                  deleteStatus.mutate(showViewers);
                  setShowViewers(null);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir status
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StatusView;
