export type ParsedExpense = {
  amount: number;
  description: string;
};

/**
 * Rule-based parser. Supports:
 *   "20 uber"
 *   "uber 20"
 *   "spent 20 on food"
 *   "20 on uber"
 *   "gastei 20 em uber"
 *   "20 no uber"
 */
export function parseExpenseMessage(text: string): ParsedExpense | null {
  const raw = text.trim();

  // Strip common leading phrases (EN + PT-BR)
  const stripped = raw
    .replace(/^(spent|gastei|paguei|comprei)\s+/i, "")
    .replace(/\s+(on|em|no|na|para)\s+/i, " ")
    .trim();

  // Match "20 uber" or "uber 20" — amount can be "20", "20.50", "20,50"
  const amountPattern = /(\d+(?:[.,]\d{1,2})?)/;

  // Amount first: "20 uber"
  const amountFirst = stripped.match(new RegExp(`^${amountPattern.source}\\s+(.+)$`));
  if (amountFirst) {
    const amount = parseAmount(amountFirst[1]);
    const description = amountFirst[2].trim();
    if (amount > 0 && description) return { amount, description };
  }

  // Description first: "uber 20"
  const descFirst = stripped.match(new RegExp(`^(.+?)\\s+${amountPattern.source}$`));
  if (descFirst) {
    const description = descFirst[1].trim();
    const amount = parseAmount(descFirst[2]);
    if (amount > 0 && description) return { amount, description };
  }

  return null;
}

function parseAmount(raw: string): number {
  // Replace comma decimal separator (PT-BR) with dot
  const normalised = raw.replace(",", ".");
  const n = parseFloat(normalised);
  return isFinite(n) && n > 0 ? n : 0;
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
 * Returns null if no keyword matches.
 */
export function suggestCategory(description: string): string | null {
  const lower = description.toLowerCase();
  for (const { keywords, category } of KEYWORD_MAP) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return null;
}
