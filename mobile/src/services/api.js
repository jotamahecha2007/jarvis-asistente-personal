/**
 * Cliente para el backend "servidor local unico" (Mac mini), accesible
 * via Tailscale en algo como http://100.x.x.x:8080/api/
 */

function headers(apiKey) {
  return {
    "Content-Type": "application/json",
    "x-jarvis-key": apiKey || "",
  };
}

export async function checkHealth(serverUrl, { timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${serverUrl}/api/health`, { signal: controller.signal });
    if (!res.ok) throw new Error(`health check fallo: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        `No hubo respuesta en ${timeoutMs / 1000}s. Revisa que el backend esté corriendo, ` +
          "que el celular y la PC estén en la misma tailnet de Tailscale, y que la URL sea correcta."
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function sendChat({ serverUrl, apiKey, messages }) {
  const res = await fetch(`${serverUrl}/api/chat`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Error ${res.status}: ${body}`);
  }
  return res.json(); // { role, content, toolsUsed }
}

export async function getIntegrationsSummary({ serverUrl, apiKey }) {
  const res = await fetch(`${serverUrl}/api/integrations/all`, { headers: headers(apiKey) });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

// --- Finanzas ---
export async function getTransactions({ serverUrl, apiKey }) {
  const res = await fetch(`${serverUrl}/api/data/transactions`, { headers: headers(apiKey) });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json(); // { items }
}

export async function getBalance({ serverUrl, apiKey }) {
  const res = await fetch(`${serverUrl}/api/data/balance`, { headers: headers(apiKey) });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function addTransaction({ serverUrl, apiKey, description, amount, transaction_type, category }) {
  const res = await fetch(`${serverUrl}/api/data/transactions`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ description, amount, transaction_type, category }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function deleteTransaction({ serverUrl, apiKey, id }) {
  const res = await fetch(`${serverUrl}/api/data/transactions/${id}`, {
    method: "DELETE",
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

// --- Tareas ---
export async function getTasks({ serverUrl, apiKey }) {
  const res = await fetch(`${serverUrl}/api/data/tasks`, { headers: headers(apiKey) });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json(); // { items }
}

export async function addTask({ serverUrl, apiKey, text }) {
  const res = await fetch(`${serverUrl}/api/data/tasks`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function updateTaskStatus({ serverUrl, apiKey, id, status }) {
  const res = await fetch(`${serverUrl}/api/data/tasks/${id}`, {
    method: "PATCH",
    headers: headers(apiKey),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function deleteTask({ serverUrl, apiKey, id }) {
  const res = await fetch(`${serverUrl}/api/data/tasks/${id}`, {
    method: "DELETE",
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

// --- Voz ---
export async function transcribeAndChat({ serverUrl, apiKey, audioBase64, extension = "m4a", history = [] }) {
  const res = await fetch(`${serverUrl}/api/transcribe`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ audioBase64, extension, history, autoChat: true }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Error ${res.status}: ${body}`);
  }
  return res.json(); // { transcript, reply, toolsUsed }
}

// --- Tarjetas de crédito / préstamos ---
export async function getCreditCards({ serverUrl, apiKey }) {
  const res = await fetch(`${serverUrl}/api/data/credit-cards`, { headers: headers(apiKey) });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function addCreditCard({ serverUrl, apiKey, name, limit_amount, used_amount, cutoff_day, due_day }) {
  const res = await fetch(`${serverUrl}/api/data/credit-cards`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ name, limit_amount, used_amount, cutoff_day, due_day }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

// --- Metas de ahorro ---
export async function getSavingsGoals({ serverUrl, apiKey }) {
  const res = await fetch(`${serverUrl}/api/data/savings-goals`, { headers: headers(apiKey) });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function addSavingsGoal({ serverUrl, apiKey, name, target_amount }) {
  const res = await fetch(`${serverUrl}/api/data/savings-goals`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ name, target_amount }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function contributeToGoal({ serverUrl, apiKey, name, amount }) {
  const res = await fetch(`${serverUrl}/api/data/savings-goals/${encodeURIComponent(name)}/contribute`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}
