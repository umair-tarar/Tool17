import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { resolve } from "node:path";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/202604180005_manual_payment_creation.sql",
);

describe("manual payment creation migration", () => {
  it("accepts only configured providers and trusted package values", async () => {
    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("requested_provider not in ('visa_card', 'nayapay', 'easypaisa', 'jazzcash')");
    expect(sql).toContain("where provider = requested_provider");
    expect(sql).toContain("and active = true");
    expect(sql).toContain("when '30k' then package_credits := 30000; package_amount := 45.00;");
  });

  it("serializes retries and never changes credits during creation", async () => {
    const sql = await readFile(migrationPath, "utf8");
    const functionBody = sql.slice(
      sql.indexOf("create or replace function public.create_manual_payment"),
      sql.indexOf("revoke all on function public.create_manual_payment"),
    );

    expect(functionBody).toContain("pg_advisory_xact_lock");
    expect(functionBody).toContain("status in ('pending_payment', 'submitted_for_review')");
    expect(functionBody).toContain("status\n  )\n  values");
    expect(functionBody).toContain("'pending_payment'");
    expect(functionBody).not.toMatch(/consume_credits|fulfill_credit_purchase|reverse_credit_purchase|credit_ledger|update public\.credits/i);
  });

  it("uses the required secured function signature and authenticated grant", async () => {
    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("security definer set search_path = public");
    expect(sql).toContain("grant execute on function public.create_manual_payment(text, text) to authenticated");
  });
});
