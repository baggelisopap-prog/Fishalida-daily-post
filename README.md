# Fishαλίδα Manager - Frontend PWA

Μια Progressive Web Application (PWA) για τη διαχείριση των καθημερινών αναρτήσεων ιχθυοπωλείου, χτισμένη με Vanilla JS, Alpine.js, Tailwind CSS και Supabase.

## Τεχνολογίες
- **Frontend:** HTML5, Tailwind CSS (CDN), Alpine.js (CDN)
- **Backend/BaaS:** Supabase JS Client v2 (CDN)
- **Deployment:** Static Hosting (GitHub Pages, Netlify, κλπ.) χωρίς build steps.

## Οδηγίες Εγκατάστασης (Deployment)

1. **Ρύθμιση Backend (Supabase):**
   - Βεβαιωθείτε ότι το σχήμα της βάσης (tables: `categories`, `fish`, `daily_status`, `post_log`) και τα RLS policies έχουν εφαρμοστεί.
   - Ενεργοποιήστε το Email Magic Link authentication (χωρίς password) από το Supabase Dashboard (Authentication > Providers > Email).
   - Δημιουργήστε τους χρήστες (admin & staff) και ορίστε το πεδίο `app_metadata.role` αντίστοιχα.

2. **Παραμετροποίηση Frontend:**
   - Ανοίξτε το αρχείο `config.js`.
   - Αντικαταστήστε το `YOUR_SUPABASE_URL_HERE` με το Project URL από το Supabase.
   - Αντικαταστήστε το `YOUR_ANON_KEY_HERE` με το `anon` public key από το Supabase.

3. **Δημοσίευση (GitHub Pages):**
   - Ανεβάστε όλα τα αρχεία σε ένα repository στο GitHub.
   - Πηγαίνετε στα Settings > Pages και επιλέξτε το branch (π.χ., `main`) ως πηγή.
   - Η εφαρμογή θα είναι άμεσα διαθέσιμη στο παραγόμενο URL.

4. **PWA & Εγκατάσταση σε κινητό:**
   - Η εφαρμογή περιέχει `manifest.json` και `service-worker.js`. 
   - Όταν ο χρήστης ανοίξει το URL από τον browser του κινητού του (Chrome, Safari), θα μπορεί να επιλέξει "Προσθήκη στην αρχική οθόνη" (Add to Home Screen) για native εμπειρία.