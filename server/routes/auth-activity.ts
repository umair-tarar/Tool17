import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { RequestHandler } from "express";
import { z } from "zod";

const activitySchema = z.object({
  action: z.enum(["login", "registration"]),
  email: z.string().email(),
  name: z.string().trim().min(1).max(120).optional(),
});

const activityFile = path.join(process.cwd(), "data", "auth-activity.jsonl");

export const recordAuthActivity: RequestHandler = async (req, res) => {
  const parsed = activitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid activity record." });
    return;
  }

  const record = {
    ...parsed.data,
    occurredAt: new Date().toISOString(),
  };

  await mkdir(path.dirname(activityFile), { recursive: true });
  await appendFile(activityFile, `${JSON.stringify(record)}\n`, "utf8");
  res.status(201).json({ ok: true });
};
