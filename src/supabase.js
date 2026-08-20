import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://dgrbiwfxspjwqbumrhef.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncmJpd2Z4c3Bqd3FidW1yaGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTMyNDcsImV4cCI6MjEwMjc2OTI0N30.npXc7wwy5JtxYR6IWRl7rEO1YXVK_0YSJVQK5d07C5E";

let supabase = null;
let isCloudActive = false;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  isCloudActive = true;
  console.log("Supabase Cloud Client initialized successfully.");
} catch (e) {
  console.error("Supabase initialization failed:", e);
}

export { supabase, isCloudActive };
