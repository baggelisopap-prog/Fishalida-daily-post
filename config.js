/**
 * Ρυθμίσεις Εφαρμογής & Supabase Credentials
 * 
 * Προσοχή: Επειδή δεν υπάρχει build step (.env αρχεία), το anon key
 * είναι εμφανές στον client. Η ασφάλεια των δεδομένων διασφαλίζεται
 * αυστηρά μέσω των Row Level Security (RLS) policies στη Supabase.
 */
window.APP_CONFIG = {
  // Supabase credentials
  SUPABASE_URL: 'YOUR_SUPABASE_URL_HERE',
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY_HERE',
  
  // n8n Webhooks
  N8N_WEBHOOK_GENERATE_POST: 'YOUR_N8N_GENERATE_URL_HERE',
  N8N_WEBHOOK_PUBLISH_POST: 'YOUR_N8N_PUBLISH_URL_HERE'
};
