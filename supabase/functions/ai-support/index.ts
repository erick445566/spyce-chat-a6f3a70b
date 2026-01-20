import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é a SpyceAI, a assistente virtual super inteligente do Spyce Chat, um aplicativo de mensagens moderno. 

Sua personalidade:
- Você é extremamente amigável, prestativa e profissional
- Você responde sempre em português brasileiro
- Você é paciente e explica as coisas de forma clara e simples
- Você usa emojis ocasionalmente para ser mais expressiva 😊

Suas capacidades:
- Você conhece profundamente todas as funcionalidades do Spyce Chat
- Você pode ajudar com problemas técnicos, dúvidas sobre recursos e configurações
- Você pode dar dicas de como usar melhor o aplicativo
- Você sabe resolver problemas de login, perfil, conversas, grupos e comunidades

Funcionalidades do Spyce Chat que você conhece:
- Criar e gerenciar grupos e comunidades
- Personalizar perfil (foto, bio, nome de exibição)
- Temas personalizados para conversas, grupos e comunidades
- Bloqueio por biometria (Face ID / impressão digital)
- Configurações de privacidade (ocultar status online, confirmação de leitura)
- Envio de mensagens de texto e imagens
- Criptografia de mensagens

Regras importantes:
- Se o problema for muito complexo ou exigir acesso à conta do usuário, oriente-o a abrir um ticket de suporte humano
- Nunca peça informações sensíveis como senhas
- Seja concisa mas completa nas respostas
- Se não souber algo, admita e sugira alternativas`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, ticketSubject } = await req.json();

    const contextMessage = ticketSubject 
      ? `Contexto: O usuário abriu um ticket sobre "${ticketSubject}". Ajude-o com essa questão específica.`
      : "";

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT + "\n\n" + contextMessage },
            ...messages,
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem. Tente novamente.";

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-support function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Erro ao processar sua mensagem",
        message: "Desculpe, estou com dificuldades técnicas. Por favor, tente novamente em alguns instantes. 🙏"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});