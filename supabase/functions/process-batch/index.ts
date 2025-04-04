// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    )

    const { data, error } = await supabase
      .from("sync_jobs")
      .select("*")
      .or(
        "completed_at.is.null,completed_at.lt." +
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      )
      .limit(10)

    if (error) {
      throw error
    }

    console.log("Fetched sync jobs:", data)
    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending jobs found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      )
    }
    // Process each job
    for (const job of data) {
      console.log("Processing job:", job.id)
      const { error: startProcessError } = await supabase
        .from("sync_jobs")
        .update({
          started_at: new Date().toISOString(),
          status: "processing",
        })
        .eq("id", job.id)
      if (startProcessError) {
        console.error(
          `Failed to update job ${job.id} to processing:`,
          startProcessError,
        )
        throw startProcessError
      }

      // Simulate job processing (replace with actual logic)
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate async work

      console.log(`Job ${job.id} processed successfully.`)
      // Update job status to completed
      const { error: updateError } = await supabase
        .from("sync_jobs")
        .update({
          completed_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("id", job.id)
      if (updateError) {
        console.error(`Failed to update job ${job.id}:`, updateError)
        throw updateError
      } else {
        console.log(`Job ${job.id} marked as completed.`)
      }
    }
    // Return success response
    console.log(`${data.length} jobs processed successfully.`)

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ message: err?.message ?? err }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
