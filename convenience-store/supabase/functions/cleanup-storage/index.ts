import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CleanupResult {
  scannedFiles: number;
  orphanedFiles: number;
  deletedFiles: number;
  freedBytes: number;
  errors: string[];
  skippedTables: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let dryRun = true; // Default to dry run for safety
    let bucket = "products";
    
    try {
      const body = await req.json();
      dryRun = body.dryRun !== false; // Only execute if explicitly set to false
      bucket = body.bucket || "products";
    } catch {
      // Use defaults if no body
    }

    const result: CleanupResult = {
      scannedFiles: 0,
      orphanedFiles: 0,
      deletedFiles: 0,
      freedBytes: 0,
      errors: [],
      skippedTables: [],
    };

    // 1. Get all files from storage bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list("", { limit: 1000 });

    if (listError) {
      throw new Error(`Failed to list files: ${listError.message}`);
    }

    result.scannedFiles = files?.filter(f => f.id).length || 0;

    // 2. Collect all used image URLs from multiple tables
    const usedUrls = new Set<string>();

    // Helper to extract filename from URL
    const extractFilename = (url: string | null): string | null => {
      if (!url) return null;
      const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
      return match ? match[1] : url.split("/").pop() || null;
    };

    // Scan products table
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("image, images");

    if (productsError) {
      result.skippedTables.push("products");
      result.errors.push(`products: ${productsError.message}`);
    } else {
      products?.forEach((p: { image?: string; images?: string[] }) => {
        if (p.image) {
          const filename = extractFilename(p.image);
          if (filename) usedUrls.add(filename);
        }
        p.images?.forEach((img: string) => {
          const filename = extractFilename(img);
          if (filename) usedUrls.add(filename);
        });
      });
    }

    // Scan banners table
    const { data: banners, error: bannersError } = await supabase
      .from("banners")
      .select("image");

    if (bannersError) {
      result.skippedTables.push("banners");
      result.errors.push(`banners: ${bannersError.message}`);
    } else {
      banners?.forEach((b: { image?: string }) => {
        if (b.image) {
          const filename = extractFilename(b.image);
          if (filename) usedUrls.add(filename);
        }
      });
    }

    // Scan categories table (if has image column)
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("icon");

    if (categoriesError) {
      result.skippedTables.push("categories");
    } else {
      categories?.forEach((c: { icon?: string }) => {
        if (c.icon && c.icon.startsWith("http")) {
          const filename = extractFilename(c.icon);
          if (filename) usedUrls.add(filename);
        }
      });
    }

    // Scan profiles table for avatars
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("avatar_url");

    if (profilesError) {
      result.skippedTables.push("profiles");
    } else {
      profiles?.forEach((p: { avatar_url?: string }) => {
        if (p.avatar_url) {
          const filename = extractFilename(p.avatar_url);
          if (filename) usedUrls.add(filename);
        }
      });
    }

    // 3. Find orphaned files
    const orphanedFiles = files?.filter(f => f.id && !usedUrls.has(f.name)) || [];
    result.orphanedFiles = orphanedFiles.length;

    // Calculate total size to be freed
    orphanedFiles.forEach(f => {
      result.freedBytes += f.metadata?.size || 0;
    });

    // 4. Delete orphaned files (only if not dry run)
    if (!dryRun && orphanedFiles.length > 0) {
      const filesToDelete = orphanedFiles.map(f => f.name);
      
      // Delete in batches of 100
      for (let i = 0; i < filesToDelete.length; i += 100) {
        const batch = filesToDelete.slice(i, i + 100);
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove(batch);

        if (deleteError) {
          result.errors.push(`Delete batch ${i}: ${deleteError.message}`);
        } else {
          result.deletedFiles += batch.length;
        }
      }
    }

    // 5. Log cleanup activity
    await supabase.from("activity_logs").insert({
      action: "storage_cleanup",
      entity_type: "storage",
      entity_id: bucket,
      old_value: null,
      new_value: {
        dryRun,
        scannedFiles: result.scannedFiles,
        orphanedFiles: result.orphanedFiles,
        deletedFiles: result.deletedFiles,
        freedMB: (result.freedBytes / (1024 * 1024)).toFixed(2),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        message: dryRun 
          ? `Dry run complete. Found ${result.orphanedFiles} orphaned files (${(result.freedBytes / (1024 * 1024)).toFixed(2)} MB). Set dryRun: false to delete.`
          : `Cleanup complete. Deleted ${result.deletedFiles} files, freed ${(result.freedBytes / (1024 * 1024)).toFixed(2)} MB.`,
        result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
