import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GetDocumentUrlRequest {
  documentId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      throw new Error("Server configuration error");
    }

    // Get auth header to pass to Supabase
    const authHeader = req.headers.get("authorization");
    
    // Create client with user's auth if available
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create client with user context for RPC call
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    const { documentId }: GetDocumentUrlRequest = await req.json();

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "Document ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Requesting signed URL for document: ${documentId}`);

    // First, get document info to check access
    const { data: document, error: docError } = await supabaseClient
      .from("documents")
      .select("id, file_url, is_free, is_published")
      .eq("id", documentId)
      .eq("is_published", true)
      .single();

    if (docError || !document) {
      console.error("Document not found:", docError);
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!document.file_url) {
      return new Response(
        JSON.stringify({ error: "Document has no file" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check access using the database function
    const { data: filePath, error: accessError } = await supabaseClient.rpc(
      "get_document_signed_url",
      { p_document_id: documentId }
    );

    if (accessError) {
      console.error("Access check failed:", accessError);
      
      if (accessError.message.includes("Authentication required")) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (accessError.message.includes("not purchased")) {
        return new Response(
          JSON.stringify({ error: "Document not purchased" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract file path from the full URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/documents/path/to/file.pdf
    // We need to extract: path/to/file.pdf
    let cleanFilePath = filePath;
    
    // If the returned value is a full URL, extract the path
    if (filePath.includes("/storage/v1/object/")) {
      cleanFilePath = filePath.replace(/^.*\/documents\//, "");
    }
    
    console.log(`Generating signed URL for path: ${cleanFilePath}`);

    // Generate signed URL using admin client (1 hour expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from("documents")
      .createSignedUrl(cleanFilePath, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error("Failed to create signed URL:", signedUrlError);
      return new Response(
        JSON.stringify({ error: "Failed to generate download URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Signed URL generated successfully");

    return new Response(
      JSON.stringify({ signedUrl: signedUrlData.signedUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in get-document-url function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
