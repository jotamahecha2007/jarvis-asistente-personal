import { Router } from "express";
import { list, remove } from "../store/db.js";
import { financialHandlers } from "../agents/financialAgent.js";
import { secretaryHandlers } from "../agents/secretaryAgent.js";

const router = Router();

// Endpoints "planos" para que la app pueda leer/escribir sin pasar por el LLM
// (el orquestador/LLM se usa para las peticiones en lenguaje natural del chat;
// estos son para que las pantallas de Finanzas y Tareas funcionen como CRUD normal).

router.get("/transactions", async (_req, res) => res.json(await financialHandlers.list_transactions({})));
router.post("/transactions", async (req, res) => {
  const { description, amount, transaction_type, category } = req.body || {};
  if (!description || !amount || !transaction_type) {
    return res.status(400).json({ error: "Faltan description, amount o transaction_type." });
  }
  res.json(await financialHandlers.add_transaction({ description, amount, transaction_type, category }));
});
router.delete("/transactions/:id", (req, res) => {
  const ok = remove("transactions", req.params.id);
  res.json({ ok });
});

router.get("/balance", async (_req, res) => res.json(await financialHandlers.get_balance_and_cashflow()));
router.get("/credit-cards", async (_req, res) => res.json(await financialHandlers.list_credit_cards()));
router.post("/credit-cards", async (req, res) => res.json(await financialHandlers.register_credit_card(req.body || {})));

router.get("/savings-goals", async (_req, res) => res.json(await financialHandlers.list_savings_goals()));
router.post("/savings-goals", async (req, res) => res.json(await financialHandlers.create_savings_goal(req.body || {})));
router.post("/savings-goals/:name/contribute", async (req, res) => {
  const { amount } = req.body || {};
  res.json(await financialHandlers.contribute_to_goal({ name: req.params.name, amount }));
});

router.get("/tasks", async (_req, res) => res.json(await secretaryHandlers.list_tasks({})));
router.post("/tasks", async (req, res) => res.json(await secretaryHandlers.create_task(req.body || {})));
router.patch("/tasks/:id", async (req, res) => {
  const { status } = req.body || {};
  const items = list("tasks");
  const found = items.find((t) => t.id === req.params.id);
  if (!found) return res.status(404).json({ error: "No existe esa tarea." });
  const result = await secretaryHandlers.update_task_status({ text_match: found.text, status });
  res.json(result);
});
router.delete("/tasks/:id", (req, res) => {
  const ok = remove("tasks", req.params.id);
  res.json({ ok });
});

router.get("/email-drafts", async (_req, res) => res.json({ items: list("email_drafts") }));

export default router;
