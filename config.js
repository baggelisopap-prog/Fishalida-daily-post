/**
 * Ρυθμίσεις Εφαρμογής & Supabase Credentials
 * 
 * Προσοχή: Επειδή δεν υπάρχει build step (.env αρχεία), το anon key
 * είναι εμφανές στον client. Η ασφάλεια των δεδομένων διασφαλίζεται
 * αυστηρά μέσω των Row Level Security (RLS) policies στη Supabase.
 */
window.APP_CONFIG = {
  // Supabase credentials
  SUPABASE_URL: 'https://ygzdlbnaqtngwsnjcodo.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_-rps5ej20k4Kff5JIicfpA_xZGQ9KRt',
  
  // n8n Webhooks
  N8N_WEBHOOK_GENERATE_POST: 'https://n8n.fishalida.gr/webhook/generate-post',
  N8N_WEBHOOK_PUBLISH_POST: 'https://n8n.fishalida.gr/webhook/publish-post'
};
