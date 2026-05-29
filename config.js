/**
 * Ρυθμίσεις Εφαρμογής & Supabase Credentials
 * * Προσοχή: Επειδή δεν υπάρχει build step (.env αρχεία), το anon key
 * είναι εμφανές στον client. Η ασφάλεια των δεδομένων διασφαλίζεται
 * αυστηρά μέσω των Row Level Security (RLS) policies στη Supabase.
 */
window.APP_CONFIG = {
  SUPABASE_URL: 'YOUR_SUPABASE_URL_HERE',
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY_HERE'
};