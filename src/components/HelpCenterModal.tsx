import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageCircleQuestion,
  Mail,
  ChevronRight,
  Send,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HelpCenterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type HelpView = "main" | "faq" | "support";

const faqItems = [
  {
    question: "Como faço para criar um grupo?",
    answer:
      "Para criar um grupo, vá para a aba de Chats e toque no ícone de adicionar (+) no canto superior direito. Selecione 'Criar grupo', escolha os participantes, defina um nome e uma foto para o grupo.",
  },
  {
    question: "Como posso alterar minha foto de perfil?",
    answer:
      "Acesse Configurações > toque na sua foto de perfil ou no seu nome. Na tela de edição de perfil, toque na foto atual para selecionar uma nova imagem da sua galeria.",
  },
  {
    question: "O que são as comunidades?",
    answer:
      "Comunidades são espaços para organizar grupos relacionados em torno de um tema comum. Você pode participar de comunidades públicas ou criar a sua própria para reunir pessoas com interesses semelhantes.",
  },
  {
    question: "Como ativar o bloqueio por biometria?",
    answer:
      "Vá em Configurações > Privacidade > Bloqueio por biometria. Ative a opção para usar sua impressão digital ou Face ID para desbloquear o aplicativo.",
  },
  {
    question: "Posso ocultar meu status online?",
    answer:
      "Sim! Em Configurações > Privacidade, ative a opção 'Ocultar status online'. Quando ativada, outros usuários não verão quando você está online, mas você também não verá o status deles.",
  },
  {
    question: "Como personalizar o tema do app?",
    answer:
      "Acesse Configurações > Aparência > Tema personalizado. Você pode escolher entre várias cores de destaque ou usar o tema padrão do sistema.",
  },
  {
    question: "Como enviar imagens nas conversas?",
    answer:
      "Na conversa, toque no ícone de anexo (clipe) e selecione 'Galeria' para enviar uma imagem existente ou 'Câmera' para tirar uma foto na hora.",
  },
  {
    question: "As mensagens são criptografadas?",
    answer:
      "Sim, todas as mensagens são protegidas com criptografia para garantir sua privacidade e segurança durante a transmissão.",
  },
  {
    question: "Como excluir minha conta?",
    answer:
      "Para excluir sua conta, entre em contato com nosso suporte através da Central de Ajuda. Note que essa ação é irreversível e todos os seus dados serão permanentemente removidos.",
  },
  {
    question: "Posso usar o Spyce em múltiplos dispositivos?",
    answer:
      "Atualmente, o Spyce funciona em um dispositivo por vez. Estamos trabalhando para adicionar suporte a múltiplos dispositivos em breve.",
  },
];

const HelpCenterModal = ({ open, onOpenChange }: HelpCenterModalProps) => {
  const [view, setView] = useState<HelpView>("main");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSendSupport = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha o assunto e a mensagem.",
      });
      return;
    }

    setSending(true);
    // Simulate sending support request
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSending(false);
    setSent(true);

    toast({
      title: "Mensagem enviada!",
      description: "Nossa equipe responderá em breve.",
    });

    // Reset after showing success
    setTimeout(() => {
      setSent(false);
      setSubject("");
      setMessage("");
      setView("main");
    }, 2000);
  };

  const handleBack = () => {
    setView("main");
    setSent(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setView("main");
      setSent(false);
      setSubject("");
      setMessage("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {view !== "main" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-xl -ml-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <DialogTitle>
              {view === "main" && "Central de Ajuda"}
              {view === "faq" && "Perguntas Frequentes"}
              {view === "support" && "Fale Conosco"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {view === "main" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Como podemos ajudar você?
              </p>

              <button
                onClick={() => setView("faq")}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircleQuestion className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Perguntas Frequentes</p>
                  <p className="text-sm text-muted-foreground">
                    Encontre respostas rápidas
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                onClick={() => setView("support")}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Fale Conosco</p>
                  <p className="text-sm text-muted-foreground">
                    Entre em contato com o suporte
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          )}

          {view === "faq" && (
            <div className="space-y-2">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-sm">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="pt-4 border-t mt-4">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Não encontrou o que procurava?
                </p>
                <Button
                  onClick={() => setView("support")}
                  className="w-full rounded-xl"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Fale com o Suporte
                </Button>
              </div>
            </div>
          )}

          {view === "support" && (
            <div className="space-y-4">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Mensagem Enviada!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Nossa equipe responderá em breve através do seu email
                    cadastrado.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Descreva seu problema ou dúvida e nossa equipe entrará em
                    contato em breve.
                  </p>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assunto</label>
                    <Input
                      placeholder="Ex: Problema com login"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mensagem</label>
                    <Textarea
                      placeholder="Descreva detalhadamente sua dúvida ou problema..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[150px] rounded-xl resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleSendSupport}
                    disabled={sending || !subject.trim() || !message.trim()}
                    className="w-full rounded-xl"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpCenterModal;
