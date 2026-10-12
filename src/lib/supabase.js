
import { createClient } from "@supabase/supabase-js";

// Retrieve configuration from Vite environment variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check that configuration is available.
if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
    "Check your .env.local file."
  );
}

// Create the Supabase client.
// We will use this for authentication and database operations.
export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
