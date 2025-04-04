// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );
    let batchSize = parseInt(Deno.env.get("BATCH_SIZE") ?? "50");
    if (isNaN(batchSize) || batchSize <= 0) {
      console.error(
        "Invalid BATCH_SIZE environment variable, defaulting to 50",
      );
      batchSize = 50;
    }
    console.log(`Batch size set to: ${batchSize}`);

    const { data, error } = await supabase
      .from("sync_jobs")
      .select("*")
      .or(
        "completed_at.is.null,completed_at.lt." +
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      )
      .limit(batchSize);

    if (error) {
      throw error;
    }

    console.log("Fetched sync jobs:", data);
    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending jobs found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }
    // Process each job
    for (const job of data) {
      console.log("Processing job:", job.id);
      const { error: startProcessError } = await supabase
        .from("sync_jobs")
        .update({
          started_at: new Date().toISOString(),
          status: "processing",
        })
        .eq("id", job.id);
      if (startProcessError) {
        console.error(
          `Failed to update job ${job.id} to processing:`,
          startProcessError,
        );
        throw startProcessError;
      }

      // Call the sync-prices function
      const syncPricesUrl = new URL(
        "/functions/v1/sync-prices",
        Deno.env.get("SUPABASE_URL"),
      ).toString(); // Adjust the URL if needed
      const syncPricesOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.get("Authorization")!, // Forward the authorization header
        },
        body: JSON.stringify({
          groupId: job.group_id,
          group: job.group,
          categoryId: job.category_id,
          name: job.name,
          abbreviation: job.abbreviation,
        }), // Pass the group ID from the job
      };

      const syncPricesResponse = await fetch(syncPricesUrl, syncPricesOptions);

      if (!syncPricesResponse.ok) {
        const errorData = await syncPricesResponse.json();
        console.error(
          `Failed to sync prices for group ${job.group_id}:`,
          errorData,
        );
        throw new Error(
          `Failed to sync prices for group ${job.group_id}: ${syncPricesResponse.statusText}`,
        );
      } else {
        const syncPricesData = await syncPricesResponse.json();
        console.log(
          `Successfully synced ${syncPricesData.lenght} prices for group ${job.group_id}:`,
        );
      }

      console.log(`Job ${job.id} processed successfully.`);
      // Update job status to completed
      const { error: updateError } = await supabase
        .from("sync_jobs")
        .update({
          completed_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("id", job.id);
      if (updateError) {
        console.error(`Failed to update job ${job.id}:`, updateError);
        throw updateError;
      } else {
        console.log(`Job ${job.id} marked as completed.`);
      }
    }

    const secondsLapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.info(
      `Took ${secondsLapsed} seconds to process ${data.length} groups`,
    );
    console.log(
      `Groups processed: ${
        data.map((job) => `${job.group_id}: ${job.name}`).join(", ")
      }`,
    );

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ message: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
