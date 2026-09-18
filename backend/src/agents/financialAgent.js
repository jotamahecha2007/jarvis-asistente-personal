import { list, insert, update, listWhere } from "../store/db.js";

const TX = "transactions";
const CARDS = "credit_cards";
const GOALS = "savings_goals";
const CONTRIBUTIONS = "savings_contributions";

export const financialTools = [
  {
    type: "function",
    function: {
      name: "add_transaction",
      description:
        "Registra un ingreso o gasto del usuario, clasificado por categoría (alimentacion, transporte, servicios, educacion, ocio, salud, otros).",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Descripción corta del movimiento" },
          amount: { type: "number", description: "Monto positivo" },
          transaction_type: { type: "string", enum: ["income", "expense"] },
          category: {
            type: "string",
            enum: ["alimentacion", "transporte", "servicios", "educacion", "ocio", "salud", "otros"],
          },
        },
        required: ["description", "amount", "transaction_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_transactions",
      description: "Lista las transacciones más recientes del usuario, opcionalmente filtradas por categoría.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          limit: { type: "number", description: "Máximo de resultados, por defecto 10" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_balance_and_cashflow",
      description:
        "Calcula el saldo disponible actual y un resumen de flujo de caja (ingresos y gastos del mes actual, agrupados por categoría).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "register_credit_card",
      description: "Registra una tarjeta de crédito o préstamo con su cupo, fecha de corte y fecha límite de pago.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          limit_amount: { type: "number" },
          used_amount: { type: "number" },
          cutoff_day: { type: "number", description: "Día del mes del corte (1-31)" },
          due_day: { type: "number", description: "Día del mes del pago límite (1-31)" },
        },
        required: ["name", "limit_amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_credit_cards",
      description: "Lista las tarjetas de crédito o préstamos registrados, con cupo usado/disponible y fechas clave.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "charge_credit_card",
      description:
        "Registra una compra hecha CON una tarjeta de crédito ya registrada: crea la transacción del gasto y aumenta el cupo usado de esa tarjeta, ambos enlazados.",
      parameters: {
        type: "object",
        properties: {
          card_name: { type: "string", description: "Nombre de la tarjeta, tal como fue registrada" },
          description: { type: "string" },
          amount: { type: "number" },
          category: {
            type: "string",
            enum: ["alimentacion", "transporte", "servicios", "educacion", "ocio", "salud", "otros"],
          },
        },
        required: ["card_name", "description", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_savings_goal",
      description: "Crea una meta de ahorro con nombre y monto objetivo.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          target_amount: { type: "number" },
        },
        required: ["name", "target_amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "contribute_to_goal",
      description: "Suma dinero a una meta de ahorro existente, identificada por nombre.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          amount: { type: "number" },
        },
        required: ["name", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_savings_goals",
      description: "Lista las metas de ahorro con su progreso porcentual.",
      parameters: { type: "object", properties: {} },
    },
  },
];

export const financialHandlers = {
  add_transaction: async ({ description, amount, transaction_type, category = "otros" }) => {
    const tx = await insert(TX, {
      description,
      amount: Math.abs(Number(amount)),
      type: transaction_type,
      category,
      date: new Date().toISOString(),
    });
    return { ok: true, transaction: tx };
  },

  list_transactions: async ({ category, limit = 10 }) => {
    let items = await list(TX, { orderBy: "date" });
    if (category) items = items.filter((it) => it.category === category);
    return { items: items.slice(0, limit) };
  },

  get_balance_and_cashflow: async () => {
    const items = await list(TX, { orderBy: "date" });
    const balance = items.reduce((s, it) => s + (it.type === "income" ? it.amount : -it.amount), 0);

    const now = new Date();
    const thisMonth = items.filter((it) => {
      const d = new Date(it.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = thisMonth.filter((it) => it.type === "income").reduce((s, it) => s + it.amount, 0);
    const expense = thisMonth.filter((it) => it.type === "expense").reduce((s, it) => s + it.amount, 0);
    const byCategory = {};
    thisMonth
      .filter((it) => it.type === "expense")
      .forEach((it) => {
        byCategory[it.category] = (byCategory[it.category] || 0) + it.amount;
      });

    return { balance, month_income: income, month_expense: expense, expense_by_category: byCategory };
  },

  register_credit_card: async ({ name, limit_amount, used_amount = 0, cutoff_day, due_day }) => {
    const card = await insert(CARDS, { name, limit_amount, used_amount, cutoff_day, due_day });
    return { ok: true, card };
  },

  list_credit_cards: async () => {
    const cards = await list(CARDS);
    return { items: cards.map((c) => ({ ...c, available: c.limit_amount - (c.used_amount || 0) })) };
  },

  charge_credit_card: async ({ card_name, description, amount, category = "otros" }) => {
    const cards = await list(CARDS);
    const card = cards.find((c) => c.name.toLowerCase() === String(card_name).toLowerCase());
    if (!card) return { ok: false, error: `No existe la tarjeta '${card_name}'. Regístrala primero.` };

    const tx = await insert(TX, {
      description,
      amount: Math.abs(Number(amount)),
      type: "expense",
      category,
      credit_card_id: card.id,
      date: new Date().toISOString(),
    });
    const updatedCard = await update(CARDS, card.id, {
      used_amount: (card.used_amount || 0) + Math.abs(Number(amount)),
    });
    return { ok: true, transaction: tx, card: updatedCard };
  },

  create_savings_goal: async ({ name, target_amount }) => {
    const goal = await insert(GOALS, { name, target_amount, saved_amount: 0 });
    return { ok: true, goal };
  },

  contribute_to_goal: async ({ name, amount }) => {
    const goals = await list(GOALS);
    const goal = goals.find((g) => g.name.toLowerCase() === String(name).toLowerCase());
    if (!goal) return { ok: false, error: `No existe la meta '${name}'` };

    // Guardamos el abono como su propia fila (relacionada por goal_id) en vez
    // de solo sumar un número — así queda un historial real y auditable.
    await insert(CONTRIBUTIONS, { goal_id: goal.id, amount: Number(amount) });
    const updated = await update(GOALS, goal.id, { saved_amount: (goal.saved_amount || 0) + Number(amount) });
    return { ok: true, goal: updated };
  },

  list_savings_goals: async () => {
    const goals = await list(GOALS);
    return {
      items: goals.map((g) => ({
        ...g,
        progress_pct: g.target_amount ? Math.round(((g.saved_amount || 0) / g.target_amount) * 100) : 0,
      })),
    };
  },

  // usado solo internamente por la ruta de historial de abonos (no es una tool del LLM)
  _listContributionsForGoal: (goalId) => listWhere(CONTRIBUTIONS, "goal_id", goalId, { orderBy: "date" }),
};