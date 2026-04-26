import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { TRACKERS, TRACKER_TYPES, EntryType } from "@/lib/trackers";
import { cn } from "@/lib/utils";

const schema = z.object({
  type: z.enum(["expense", "sleep", "study", "exercise"]),
  amount: z.coerce.number().positive("Must be positive").max(100000),
  category: z.string().max(60).optional(),
  note: z.string().max(500).optional(),
  entry_date: z.string().min(1),
});

const AddEntry = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialType = (params.get("type") as EntryType) || "expense";

  const [type, setType] = useState<EntryType>(initialType);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCategory(TRACKERS[type].categories[0]);
  }, [type]);

  const tracker = TRACKERS[type];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ type, amount, category, note, entry_date: date });
    if (!parsed.success) {
      toast({ title: "Invalid entry", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await api.createEntry({
        type,
        amount: parsed.data.amount,
        category: parsed.data.category || null,
        note: parsed.data.note || null,
        entryDate: parsed.data.entry_date,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save";
      toast({ title: "Could not save", description: message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    toast({ title: "Saved!", description: `${tracker.emoji} ${tracker.label} entry added.` });
    navigate("/dashboard");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold">Add an entry</h1>
          <p className="mt-1 text-muted-foreground">Log something you did today.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TRACKER_TYPES.map((t) => {
            const cfg = TRACKERS[t];
            const active = t === type;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all",
                  active
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="text-3xl">{cfg.emoji}</span>
                <span className="mt-1 text-sm font-medium">{cfg.label}</span>
              </button>
            );
          })}
        </div>

        <Card className="p-6 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">{tracker.amountLabel} ({tracker.unit})</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tracker.categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Anything to remember about this..." />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">Cancel</Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={submitting}>
                {submitting ? "Saving..." : "Save entry"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
};

export default AddEntry;
