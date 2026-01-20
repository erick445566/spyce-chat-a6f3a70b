import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Send,
  Loader2,
  MessageSquare,
  Bot,
  User,
  Headphones,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useSupportTickets,
  useTicketMessages,
  useCreateTicket,
  useSendTicketMessage,
  useAISupport,
  useCloseTicket,
  SupportTicket,
  TicketMessage,
} from "@/hooks/useSupportTickets";
import { useToast } from "@/hooks/use-toast";

interface SupportTicketsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type View = "list" | "new" | "chat";

const statusConfig = {
  open: { label: "Aberto", color: "bg-blue-500", icon: Clock },
  in_progress: { label: "Em andamento", color: "bg-yellow-500", icon: Loader2 },
  resolved: { label: "Resolvido", color: "bg-green-500", icon: CheckCircle2 },
  closed: { label: "Fechado", color: "bg-gray-500", icon: XCircle },
};

const SupportTicketsModal = ({ open, onOpenChange }: SupportTicketsModalProps) => {
  const [view, setView] = useState<View>("list");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: tickets = [], isLoading: ticketsLoading } = useSupportTickets();
  const { data: messages = [], isLoading: messagesLoading } = useTicketMessages(
    selectedTicket?.id || null
  );
  const createTicket = useCreateTicket();
  const sendMessage = useSendTicketMessage();
  const aiSupport = useAISupport();
  const closeTicket = useCloseTicket();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha o assunto e a mensagem.",
      });
      return;
    }

    try {
      const ticket = await createTicket.mutateAsync({
        subject: newSubject,
        initialMessage: newMessage,
      });

      setSelectedTicket(ticket);
      setNewSubject("");
      setNewMessage("");
      setView("chat");

      // Get AI response for the initial message
      await getAIResponse(ticket.id, ticket.subject, newMessage);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o ticket.",
      });
    }
  };

  const getAIResponse = async (ticketId: string, subject: string, userMessage: string) => {
    setAiThinking(true);
    try {
      const aiResponse = await aiSupport.mutateAsync({
        messages: [{ role: "user", content: userMessage }],
        ticketSubject: subject,
      });

      await sendMessage.mutateAsync({
        ticketId,
        content: aiResponse,
        senderType: "ai",
      });
    } catch (error) {
      console.error("AI error:", error);
    } finally {
      setAiThinking(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedTicket) return;

    const userMessage = chatMessage;
    setChatMessage("");

    try {
      await sendMessage.mutateAsync({
        ticketId: selectedTicket.id,
        content: userMessage,
        senderType: "user",
      });

      // Get AI response
      const conversationHistory = messages.map((m) => ({
        role: m.sender_type === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      }));
      conversationHistory.push({ role: "user", content: userMessage });

      await getAIResponse(selectedTicket.id, selectedTicket.subject, userMessage);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
      });
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      await closeTicket.mutateAsync(selectedTicket.id);
      setView("list");
      setSelectedTicket(null);
      toast({
        title: "Ticket fechado",
        description: "O ticket foi encerrado com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível fechar o ticket.",
      });
    }
  };

  const handleBack = () => {
    if (view === "chat" || view === "new") {
      setView("list");
      setSelectedTicket(null);
    }
  };

  const handleClose = () => {
    setView("list");
    setSelectedTicket(null);
    onOpenChange(false);
  };

  const openTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setView("chat");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center gap-2">
            {view !== "list" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-xl -ml-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              {view === "list" && "Suporte"}
              {view === "new" && "Novo Ticket"}
              {view === "chat" && selectedTicket?.subject}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {view === "list" && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm">
                  Nossa <strong>SpyceAI</strong> está pronta para ajudar! Crie um ticket e receba suporte instantâneo.
                </p>
              </div>

              <Button
                onClick={() => setView("new")}
                className="w-full rounded-xl mb-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Ticket
              </Button>

              {ticketsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum ticket ainda</p>
                  <p className="text-sm text-muted-foreground">
                    Crie um ticket para falar com nosso suporte
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tickets.map((ticket) => {
                    const StatusIcon = statusConfig[ticket.status].icon;
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => openTicket(ticket)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(ticket.updated_at), "dd 'de' MMM 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`${statusConfig[ticket.status].color} text-white text-xs`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[ticket.status].label}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {view === "new" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assunto</label>
                <Input
                  placeholder="Ex: Problema ao enviar mensagens"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descreva seu problema</label>
                <Textarea
                  placeholder="Explique detalhadamente o que está acontecendo..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[150px] rounded-xl resize-none"
                />
              </div>

              <Button
                onClick={handleCreateTicket}
                disabled={createTicket.isPending || !newSubject.trim() || !newMessage.trim()}
                className="w-full rounded-xl"
              >
                {createTicket.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Criar Ticket
                  </>
                )}
              </Button>
            </div>
          )}

          {view === "chat" && selectedTicket && (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))
                  )}
                  {aiThinking && (
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">SpyceAI está digitando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {selectedTicket.status !== "closed" ? (
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="rounded-xl"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!chatMessage.trim() || sendMessage.isPending || aiThinking}
                      size="icon"
                      className="rounded-xl"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex justify-center mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseTicket}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Fechar ticket
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Este ticket foi encerrado.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MessageBubble = ({ message }: { message: TicketMessage }) => {
  const isUser = message.sender_type === "user";
  const isAI = message.sender_type === "ai";

  return (
    <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : isAI
            ? "bg-primary/10"
            : "bg-green-500"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : isAI ? (
          <Bot className="w-4 h-4 text-primary" />
        ) : (
          <Headphones className="w-4 h-4 text-white" />
        )}
      </div>
      <div
        className={`rounded-2xl px-4 py-3 max-w-[80%] ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted rounded-tl-sm"
        }`}
      >
        {!isUser && (
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {isAI ? "SpyceAI" : "Suporte"}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {format(new Date(message.created_at), "HH:mm")}
        </p>
      </div>
    </div>
  );
};

export default SupportTicketsModal;