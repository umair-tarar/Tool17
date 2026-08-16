import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { RequestHandler } from "express";
import { z } from "zod";
import {
  creditPackages,
  paymentProviders,
  type PaymentProviderId,
} from "../../shared/payments";
import {
  getAllProviderConfigurationStatuses,
  getPaymentMode,
} from "../payments/config";
import {
  getPaymentProvider,
  ProviderNotReadyError,
} from "../payments/providers";

export const createPaymentSchema = z.object({
  packageId: z.enum(["10k", "30k", "50k", "75k", "100k"]),
  provider: z.enum(paymentProviders),
});

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function bearerToken(authorization?: string) {
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length);
}

async function authenticatedUser(authorization?: string) {
  const token = bearerToken(authorization);
  const supabase = createSupabaseAdmin();
  if (!token || !supabase) return null;
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

export const getPaymentConfiguration: RequestHandler = (_req, res) => {
  res.json({
    mode: getPaymentMode(),
    providers: getAllProviderConfigurationStatuses(),
  });
};

export const createPayment: RequestHandler = async (req, res) => {
  const parsed = createPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payment request." });
    return;
  }

  const user = await authenticatedUser(req.header("authorization"));
  if (!user) {
    res
      .status(401)
      .json({ error: "Please sign in before purchasing credits." });
    return;
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    res.status(503).json({ error: "Payments are not configured." });
    return;
  }

  const { data: instructions, error: instructionsError } = await supabase
    .from("payment_instructions")
    .select("display_name,account_identifier,instructions,account_holder")
    .eq("provider", parsed.data.provider)
    .eq("active", true)
    .maybeSingle();
  if (instructionsError || !instructions) {
    res
      .status(409)
      .json({ error: "This payment method is not currently available." });
    return;
  }

  const { data: existingPurchase, error: existingPurchaseError } =
    await supabase
      .from("purchases")
      .select(
        "id,package_id,credit_amount,amount,currency,provider,provider_reference,status",
      )
      .eq("user_id", user.id)
      .eq("package_id", parsed.data.packageId)
      .in("status", ["pending_payment", "submitted_for_review"])
      .maybeSingle();

  if (existingPurchaseError) {
    console.error(
      "Unable to check pending manual payment",
      existingPurchaseError,
    );
    res
      .status(500)
      .json({ error: "Unable to create the manual payment request." });
    return;
  }

  if (existingPurchase) {
    if (existingPurchase.provider !== parsed.data.provider) {
      res
        .status(409)
        .json({
          error: "You already have a pending payment request for this package.",
        });
      return;
    }
    res
      .status(200)
      .json({
        purchase: existingPurchase,
        instructions,
        workflow: "manual_payment_verification",
      });
    return;
  }

  const packageDetails = creditPackages[parsed.data.packageId];
  const reference = `plv_${randomUUID().replace(/-/g, "")}`;
  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      user_id: user.id,
      package_id: parsed.data.packageId,
      credit_amount: packageDetails.credits,
      amount: packageDetails.amount,
      currency: packageDetails.currency,
      provider: parsed.data.provider,
      provider_reference: reference,
      status: "pending_payment",
    })
    .select(
      "id,package_id,credit_amount,amount,currency,provider,provider_reference,status",
    )
    .single();

  if (purchaseError || !purchase) {
    console.error("Unable to create pending purchase", purchaseError);
    if (purchaseError?.code === "23505") {
      res
        .status(409)
        .json({
          error: "You already have a pending payment request for this package.",
        });
      return;
    }
    res
      .status(500)
      .json({ error: "Unable to create the manual payment request." });
    return;
  }

  res
    .status(201)
    .json({ purchase, instructions, workflow: "manual_payment_verification" });
};

export function paymentWebhook(providerId: PaymentProviderId): RequestHandler {
  return async (req, res) => {
    const provider = getPaymentProvider(providerId);
    try {
      const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
      const callbackBody = rawBody?.length
        ? rawBody
        : Buffer.from(
            new URLSearchParams(req.body as Record<string, string>).toString(),
          );
      const verified = await provider.verifyWebhook(callbackBody, req.headers);
      const supabase = createSupabaseAdmin();
      if (!supabase) {
        res.status(503).json({ error: "Payments are not configured." });
        return;
      }

      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .select("id")
        .eq("provider", providerId)
        .eq("provider_reference", verified.reference)
        .maybeSingle();
      if (purchaseError || !purchase) {
        res
          .status(400)
          .json({ error: "Payment does not match a pending purchase." });
        return;
      }

      if (verified.kind === "payment_failed") {
        await supabase
          .from("purchases")
          .update({
            status: "failed",
            failure_reason: "JazzCash payment was not successful",
          })
          .eq("id", purchase.id)
          .in("status", ["pending", "paid"]);
        res.status(200).json({ ok: true });
        return;
      }

      if (verified.kind === "payment_reversed") {
        const { error: reversalError } = await supabase.rpc(
          "reverse_credit_purchase",
          {
            target_purchase_id: purchase.id,
            expected_provider: providerId,
            expected_reference: verified.reference,
            reversal_transaction_id: verified.providerTransactionId,
          },
        );
        if (reversalError) {
          console.error("Unable to reverse verified payment", reversalError);
          res
            .status(400)
            .json({ error: "Payment reversal could not be applied." });
          return;
        }
        res.status(200).json({ ok: true });
        return;
      }

      const { error: fulfillmentError } = await supabase.rpc(
        "fulfill_credit_purchase",
        {
          target_purchase_id: purchase.id,
          expected_provider: providerId,
          expected_reference: verified.reference,
          verified_transaction_id: verified.providerTransactionId,
          verified_amount: verified.amount,
          verified_currency: verified.currency,
        },
      );
      if (fulfillmentError) {
        console.error("Unable to fulfill verified payment", fulfillmentError);
        res.status(400).json({ error: "Payment could not be fulfilled." });
        return;
      }
      res.status(200).json({ ok: true });
    } catch (error) {
      if (error instanceof ProviderNotReadyError) {
        res.status(503).json({ error: "Payment provider is not active." });
        return;
      }
      console.error("Invalid payment notification", error);
      res.status(400).json({ error: "Invalid payment notification." });
    }
  };
}
