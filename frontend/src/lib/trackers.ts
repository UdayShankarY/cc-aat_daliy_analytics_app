export type EntryType = "expense" | "sleep" | "study" | "exercise";

export interface EntryRecord {
  id: string;
  user_id: string;
  type: EntryType;
  amount: number;
  category: string | null;
  note: string | null;
  entry_date: string;
  created_at: string;
}

export const TRACKERS: Record<EntryType, {
  label: string;
  emoji: string;
  unit: string;
  amountLabel: string;
  colorVar: string;
  categories: string[];
}> = {
  expense: {
    label: "Expense",
    emoji: "💸",
    unit: "$",
    amountLabel: "Amount",
    colorVar: "hsl(var(--tracker-expense))",
    categories: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"],
  },
  sleep: {
    label: "Sleep",
    emoji: "💤",
    unit: "h",
    amountLabel: "Hours slept",
    colorVar: "hsl(var(--tracker-sleep))",
    categories: ["Night", "Nap"],
  },
  study: {
    label: "Study",
    emoji: "📚",
    unit: "h",
    amountLabel: "Hours studied",
    colorVar: "hsl(var(--tracker-study))",
    categories: ["Class", "Self-study", "Project", "Reading"],
  },
  exercise: {
    label: "Exercise",
    emoji: "🏃",
    unit: "min",
    amountLabel: "Minutes",
    colorVar: "hsl(var(--tracker-exercise))",
    categories: ["Run", "Gym", "Walk", "Yoga", "Sports", "Other"],
  },
};

export const TRACKER_TYPES: EntryType[] = ["expense", "sleep", "study", "exercise"];
