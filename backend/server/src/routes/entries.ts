import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { EntryModel } from "../models/Entry.js";

export function entriesRouter(opts: { jwtSecret: string }) {
  const router = Router();

  const createSchema = z.object({
    type: z.enum(["expense", "sleep", "study", "exercise"]),
    amount: z.coerce.number().positive().max(100000),
    category: z.string().max(60).nullable().optional(),
    note: z.string().max(500).nullable().optional(),
    entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  });

  router.use(requireAuth(opts.jwtSecret));

  router.get("/", async (req: AuthedRequest, res) => {
    const userId = req.auth!.sub;
    const since = typeof req.query.since === "string" ? req.query.since : undefined;
    const limit = typeof req.query.limit === "string" ? Math.min(parseInt(req.query.limit, 10) || 200, 500) : 200;

    const query: Record<string, unknown> = { userId };
    if (since) query.entryDate = { $gte: since };

    const entries = await EntryModel.find(query).sort({ entryDate: -1, createdAt: -1 }).limit(limit).lean();
    return res.json({
      entries: entries.map((e) => ({
        id: e._id.toString(),
        userId: e.userId.toString(),
        type: e.type,
        amount: e.amount,
        category: e.category ?? null,
        note: e.note ?? null,
        entryDate: e.entryDate,
        createdAt: e.createdAt,
      })),
    });
  });

  router.post("/", async (req: AuthedRequest, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_body", message: parsed.error.issues[0]?.message });

    const userId = req.auth!.sub;
    const created = await EntryModel.create({
      userId,
      type: parsed.data.type,
      amount: parsed.data.amount,
      category: parsed.data.category ?? null,
      note: parsed.data.note ?? null,
      entryDate: parsed.data.entryDate,
    });

    return res.status(201).json({
      entry: {
        id: created._id.toString(),
        userId,
        type: created.type,
        amount: created.amount,
        category: created.category ?? null,
        note: created.note ?? null,
        entryDate: created.entryDate,
        createdAt: created.createdAt,
      },
    });
  });

  return router;
}

