import { useState } from "react";
import { Flame, User, Lock, Mail, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import spyceBg from "@/assets/spyce-bg.jpg";
import { z } from "zod";

type AuthMode = "welcome" | "login" | "register";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

const registerSchema = loginSchema.extend({
  username: z
    .string()
    .trim()
    .min(3, { message: "Username deve ter pelo menos 3 caracteres" })
    .max(20, { message: "Username deve ter no máximo 20 caracteres" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username só pode ter letras, números e _" }),
});

const AuthScreen = () => {
  const [mode, setMode] = useState<AuthMode>("welcome");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate form data
      const schema = mode === "register" ? registerSchema : loginSchema;
      const result = schema.safeParse(formData);

      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setLoading(false);
        return;
      }

      if (mode === "register") {
        const { error } = await signUp(formData.email, formData.password, formData.username);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              variant: "destructive",
              title: "E-mail já cadastrado",
              description: "Este e-mail já está em uso. Tente fazer login.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Erro ao criar conta",
              description: error.message,
            });
          }
        } else {
          toast({
            title: "Conta criada!",
            description: "Bem-vindo ao Spyce Chat! 🔥",
          });
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              variant: "destructive",
              title: "Credenciais inválidas",
              description: "E-mail ou senha incorretos.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Erro ao entrar",
              description: error.message,
            });
          }
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (mode === "welcome") {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={spyceBg}
            alt="Spyce background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-12 pt-20">
          {/* Logo & Title */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl spyce-gradient shadow-spyce-lg mb-6">
              <Flame className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-3">
              <span className="spyce-gradient-text">Spyce</span> Chat
            </h1>
            <p className="text-muted-foreground text-lg">
              Mensagens privadas. Liberdade total.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-10 animate-slide-up">
            <FeatureItem
              icon={<Lock className="w-5 h-5" />}
              title="100% Privado"
              description="Sem número de telefone necessário"
            />
            <FeatureItem
              icon={<Mail className="w-5 h-5" />}
              title="Mensagens Seguras"
              description="Textos, áudios, fotos e vídeos"
            />
            <FeatureItem
              icon={<User className="w-5 h-5" />}
              title="Anônimo"
              description="Cadastre-se apenas com username"
            />
          </div>

          <div className="space-y-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <Button
              variant="spyce"
              size="xl"
              className="w-full"
              onClick={() => setMode("register")}
            >
              Começar agora
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button
              variant="glass"
              size="lg"
              className="w-full"
              onClick={() => setMode("login")}
            >
              Já tenho uma conta
            </Button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            © 2025 From Spyce Inc. Todos os direitos reservados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 pt-12">
        <button
          onClick={() => setMode("welcome")}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pb-12 animate-slide-up">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl spyce-gradient shadow-spyce mb-4">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {mode === "login" ? "Bem-vindo de volta!" : "Criar conta"}
          </h2>
          <p className="text-muted-foreground">
            {mode === "login"
              ? "Entre com suas credenciais"
              : "Cadastre-se gratuitamente"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome de usuário</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  name="username"
                  placeholder="Escolha um username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="pl-12"
                  disabled={loading}
                />
              </div>
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-12"
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-12 pr-12"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          <Button
            variant="spyce"
            size="lg"
            className="w-full mt-6"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Entrar" : "Criar conta"}
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-primary font-medium hover:underline"
            >
              {mode === "login" ? "Cadastre-se" : "Faça login"}
            </button>
          </p>
        </div>
        
        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2025 From Spyce Inc. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

const FeatureItem = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl glass">
    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary">
      {icon}
    </div>
    <div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default AuthScreen;
