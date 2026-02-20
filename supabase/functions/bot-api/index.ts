import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-bot-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const botToken = req.headers.get("x-bot-token");
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: "Missing x-bot-token header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from("bot_tokens")
      .select("*")
      .eq("token", botToken)
      .eq("is_active", true)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive bot token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Bot token expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update last_used_at
    await supabase
      .from("bot_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/bot-api\/?/, "");

    // Route: GET /conversations - list bot owner's conversations
    if (req.method === "GET" && (path === "conversations" || path === "")) {
      const { data: participations, error } = await supabase
        .from("conversation_participants")
        .select("conversation_id, conversations(*)")
        .eq("user_id", tokenData.user_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ conversations: participations?.map((p: any) => p.conversations) || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route: GET /messages?conversation_id=xxx&limit=50
    if (req.method === "GET" && path === "messages") {
      const conversationId = url.searchParams.get("conversation_id");
      const limit = parseInt(url.searchParams.get("limit") || "50");

      if (!conversationId) {
        return new Response(
          JSON.stringify({ error: "conversation_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify bot owner is participant
      const { data: participant } = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", tokenData.user_id)
        .maybeSingle();

      if (!participant) {
        return new Response(
          JSON.stringify({ error: "Not a participant of this conversation" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: messages, error } = await supabase
        .from("messages")
        .select("*, sender:profiles(id, username, display_name, avatar_url)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return new Response(
        JSON.stringify({ messages: messages?.reverse() || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route: POST /send - send a message
    if (req.method === "POST" && path === "send") {
      const body = await req.json();
      const { conversation_id, content, message_type = "text" } = body;

      if (!conversation_id || !content) {
        return new Response(
          JSON.stringify({ error: "conversation_id and content required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify bot owner is participant
      const { data: participant } = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversation_id)
        .eq("user_id", tokenData.user_id)
        .maybeSingle();

      if (!participant) {
        return new Response(
          JSON.stringify({ error: "Not a participant of this conversation" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation_id,
          sender_id: tokenData.user_id,
          content,
          message_type,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route: POST /pair - pair using pairing code
    if (req.method === "POST" && path === "pair") {
      const body = await req.json();
      const { pairing_code } = body;

      if (!pairing_code) {
        return new Response(
          JSON.stringify({ error: "pairing_code required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: token, error } = await supabase
        .from("bot_tokens")
        .select("token, name, user_id")
        .eq("pairing_code", pairing_code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !token) {
        return new Response(
          JSON.stringify({ error: "Invalid pairing code" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ token: token.token, name: token.name }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Not found",
        available_routes: [
          "GET /conversations",
          "GET /messages?conversation_id=xxx",
          "POST /send { conversation_id, content }",
          "POST /pair { pairing_code }",
        ],
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Bot API error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
