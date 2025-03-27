import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

export async function getCronSources() {
  console.log("Fetching sources...");
  const { data: sources, error } = await supabase
    .from("sources")
    .select("identifier");

  if (error) {
    throw new Error(`Failed to fetch sources: ${error.message}`);
  }

  console.log("Sources fetched:", sources);
  return sources.map((source) => source.identifier);
}
