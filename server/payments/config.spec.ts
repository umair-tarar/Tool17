import { describe, expect, it } from "vitest";
import { getAllProviderConfigurationStatuses, getPaymentMode, getProviderConfigurationStatus } from "./config";
import { getPaymentProvider, ProviderNotReadyError } from "./providers";
import { createPaymentSchema } from "../routes/payments";

describe("payment provider configuration", () => {
  it("defaults to sandbox without exposing credentials", () => {
    const status = getProviderConfigurationStatus("jazzcash", {
      PAYMENT_MODE: "sandbox",
      JAZZCASH_SECRET: "do-not-return",
    });

    expect(status.provider).toBe("jazzcash");
    expect(status.configured).toBe(false);
    expect(status.mode).toBe("sandbox");
    expect(status.missing).toContain("official JazzCash Online Payment Gateway documentation and credentials");
    expect(JSON.stringify(status)).not.toContain("do-not-return");
  });

  it("accepts production as the explicit mode", () => {
    expect(getPaymentMode({ PAYMENT_MODE: "production" })).toBe("production");
  });

  it("reports every requested provider as pending", () => {
    expect(getAllProviderConfigurationStatuses({})).toHaveLength(4);
    expect(getAllProviderConfigurationStatuses({}).every((status) => !status.configured)).toBe(true);
  });

  it("rejects invalid provider and package values", () => {
    expect(createPaymentSchema.safeParse({ provider: "unknown", packageId: "10k" }).success).toBe(false);
    expect(createPaymentSchema.safeParse({ provider: "nayapay", packageId: "1k" }).success).toBe(false);
  });

  it("does not fake provider operations when configuration is missing", async () => {
    const provider = getPaymentProvider("nayapay");

    expect(provider.isReady()).toBe(false);
    await expect(provider.getTransactionStatus("transaction")).rejects.toBeInstanceOf(ProviderNotReadyError);
    await expect(provider.reverse("transaction")).rejects.toBeInstanceOf(ProviderNotReadyError);
  });
});
