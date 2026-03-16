export type ParsedExpense = {
  amount: number;
  description: string;
  type: "expense" | "income";
  unbudgeted?: boolean;
};

const INCOME_PREFIXES = /^(income|received|recebi|recebido|entrada|earned|\+)\s*/i;
const EXPENSE_PREFIXES = /^(spent|gastei|paguei|comprei|expense|gasto)\s*/i;
const UNBUDGETED_PREFIXES = /^(nb|unbudgeted|nobudget|sem\s*orcamento)\s+/i;

/**
 * Rule-based parser. Supports:
 *   "20 uber"
 *   "uber 20"
 *   "spent 20 on food"
 *   "20 on uber"
 *   "gastei 20 em uber"
 *   "20 no uber"
 *   "income 500 salary"
 *   "recebi 500 salário"
 *   "+500 freelance"
 */
export function parseExpenseMessage(text: string): ParsedExpense | null {
  const raw = text.trim();

  // Detect unbudgeted prefix
  let unbudgeted = false;
  let preCleaned = raw;
  if (UNBUDGETED_PREFIXES.test(preCleaned)) {
    unbudgeted = true;
    preCleaned = preCleaned.replace(UNBUDGETED_PREFIXES, "").trim();
  }

  // Detect type
  let type: "expense" | "income" = "expense";
  let cleaned = preCleaned;

  if (INCOME_PREFIXES.test(cleaned)) {
    type = "income";
    cleaned = cleaned.replace(INCOME_PREFIXES, "").trim();
  } else if (EXPENSE_PREFIXES.test(cleaned)) {
    type = "expense";
    cleaned = cleaned.replace(EXPENSE_PREFIXES, "").trim();
  }

  // Strip connector words (EN + PT-BR)
  const stripped = cleaned
    .replace(/\s+(on|em|no|na|para|from|de|do|da)\s+/i, " ")
    .trim();

  const amountPattern = /(\d+(?:[.,]\d{1,2})?)/;

  // Amount first: "20 uber"
  const amountFirst = stripped.match(new RegExp(`^${amountPattern.source}\\s+(.+)$`));
  if (amountFirst) {
    const amount = parseAmount(amountFirst[1]);
    const description = amountFirst[2].trim();
    if (amount > 0 && description) return { amount, description, type, unbudgeted };
  }

  // Description first: "uber 20"
  const descFirst = stripped.match(new RegExp(`^(.+?)\\s+${amountPattern.source}$`));
  if (descFirst) {
    const description = descFirst[1].trim();
    const amount = parseAmount(descFirst[2]);
    if (amount > 0 && description) return { amount, description, type, unbudgeted };
  }

  // Amount only: "20" (no description)
  const amountOnly = stripped.match(new RegExp(`^${amountPattern.source}$`));
  if (amountOnly) {
    const amount = parseAmount(amountOnly[1]);
    if (amount > 0) return { amount, description: type === "income" ? "Income" : "Expense", type, unbudgeted };
  }

  return null;
}

function parseAmount(raw: string): number {
  const normalised = raw.replace(",", ".");
  const n = parseFloat(normalised);
  return isFinite(n) && n > 0 ? n : 0;
}

// ---------------------------------------------------------------------------
// Confirmation detection
// ---------------------------------------------------------------------------

const CONFIRM_WORDS = ["yes", "ok", "confirm", "sim", "s", "y", "✅", "👍", "confirma", "confirmar"];
const CANCEL_WORDS = ["no", "cancel", "não", "nao", "n", "❌", "cancelar", "delete", "apagar"];
const CATEGORY_WORDS = ["category", "categories", "cat", "budget", "budgets", "categoria", "categorias"];

export type UserReply = "confirm" | "cancel" | "category" | "other";

export function detectReply(text: string): UserReply {
  const lower = text.trim().toLowerCase();
  if (CONFIRM_WORDS.includes(lower)) return "confirm";
  if (CANCEL_WORDS.includes(lower)) return "cancel";
  if (CATEGORY_WORDS.includes(lower)) return "category";
  return "other";
}

// ---------------------------------------------------------------------------
// Category keyword mapping
// ---------------------------------------------------------------------------

type KeywordMap = { keywords: string[]; category: string }[];

const KEYWORD_MAP: KeywordMap = [
  { keywords: ["uber", "99", "taxi", "cab", "lyft", "transport", "bus", "metro", "ônibus", "onibus", "moto"], category: "Transport" },
  { keywords: ["food", "comida", "lunch", "almoço", "almoco", "dinner", "jantar", "breakfast", "cafe", "café", "lanche", "snack", "meal", "refeição", "refeicao"], category: "Food" },
  { keywords: ["market", "mercado", "supermarket", "supermercado", "grocery", "groceries", "feira"], category: "Groceries" },
  { keywords: ["netflix", "spotify", "amazon", "disney", "hbo", "youtube", "prime", "streaming", "subscription", "assinatura"], category: "Subscriptions" },
  { keywords: ["pharmacy", "farmacia", "farmácia", "medicine", "remedio", "remédio", "health", "saude", "saúde", "doctor", "medico", "médico"], category: "Health" },
  { keywords: ["rent", "aluguel", "apartment", "apartamento", "condominio", "condomínio", "gas", "electricity", "internet", "water", "light", "luz", "agua", "água"], category: "Housing" },
  { keywords: ["restaurant", "restaurante", "bar", "pizza", "hamburguer", "hamburger", "sushi", "ifood", "rappi", "delivery"], category: "Restaurants" },
  { keywords: ["clothing", "roupa", "shoe", "sapato", "fashion", "moda", "zara", "hm", "shopping"], category: "Shopping" },
  { keywords: ["gym", "academia", "sport", "esporte", "fitness"], category: "Fitness" },
  { keywords: ["gas station", "gasolina", "fuel", "combustivel", "combustível", "posto"], category: "Fuel" },
];

/**
 * Returns a suggested category name based on the description.
 */
export function suggestCategory(description: string): string | null {
  const lower = description.toLowerCase();
  for (const { keywords, category } of KEYWORD_MAP) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return null;
}
