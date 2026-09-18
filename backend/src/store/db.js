import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.warn(
    "[db] Falta SUPABASE_URL o SUPABASE_SERVICE_KEY en .env — el backend no podrá leer/escribir datos."
  );
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * Misma "forma" que la versión anterior basada en archivos JSON (list/insert/
 * update/remove), pero ahora habla con Postgres (Supabase) de verdad. El resto
 * del código (agentes, rutas) no necesita saber que esto cambió — solo que
 * ahora estas funciones son async y hay que hacerles await.
 */

export async function list(table, { orderBy = "id", ascending = false } = {}) {
  const { data, error } = await supabase.from(table).select("*").order(orderBy, { ascending });
  if (error) throw new Error(`[db.list:${table}] ${error.message}`);
  return data;
}

export async function insert(table, item) {
  const { data, error } = await supabase.from(table).insert(item).select().single();
  if (error) throw new Error(`[db.insert:${table}] ${error.message}`);
  return data;
}

export async function update(table, id, patch) {
  const { data, error } = await supabase.from(table).update(patch).eq("id", id).select().single();
  if (error) throw new Error(`[db.update:${table}] ${error.message}`);
  return data;
}

export async function remove(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(`[db.remove:${table}] ${error.message}`);
  return true;
}

// Consulta genérica con filtro simple, para casos como "abonos de esta meta"
export async function listWhere(table, column, value, { orderBy = "id", ascending = false } = {}) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq(column, value)
    .order(orderBy, { ascending });
  if (error) throw new Error(`[db.listWhere:${table}] ${error.message}`);
  return data;
}