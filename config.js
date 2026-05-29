/**
 * Ρυθμίσεις Εφαρμογής & Supabase Credentials
 * * Προσοχή: Επειδή δεν υπάρχει build step (.env αρχεία), το anon key
 * είναι εμφανές στον client. Η ασφάλεια των δεδομένων διασφαλίζεται
 * αυστηρά μέσω των Row Level Security (RLS) policies στη Supabase.
 */
window.APP_CONFIG = {
  SUPABASE_URL: 'https://ygzdlbnaqtngwsnjcodo.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnemRsYm5hcXRuZ3dzbmpjb2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NjcxNDgsImV4cCI6MjA5NTQ0MzE0OH0.7mFPfCabi7TnpyzhUfHOXWyXGfEpnw-iCA2a3SZ4Pqk'
};
