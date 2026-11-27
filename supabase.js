
/* =========================================
   D'PANIAGUA TECHNOLOGY
   CONEXIÓN CON SUPABASE
========================================= */

const SUPABASE_URL =
    "https://fmtdechddnaqpmstaige.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_jSfmKql9irBRPNY4svIF9g__d-nDQwH";

// Verificar librería y credenciales
const supabaseReady =
    typeof window.supabase !== "undefined" &&
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY.startsWith("sb_publishable_");

// Crear cliente
const db = supabaseReady
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    )
    : null;

// Mantener las funciones existentes del proyecto
window.DP = window.DP || {};

window.DP.db = db;
window.DP.supabaseReady = supabaseReady;

// Confirmar estado
if (db) {
    console.log("D'PANIAGUA TECHNOLOGY: Supabase inicializado correctamente.");
} else {
    console.error("Error: revisa la URL y la clave pública de Supabase.");
}
