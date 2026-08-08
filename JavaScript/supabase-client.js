/* ============================================
   NEHUL – Museu Digital
   supabase-client.js — cliente único compartilhado
   por todas as páginas (evita conflito de nomes com
   o objeto global "supabase" da biblioteca).
   ============================================ */

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
