import type { PaymentProviderId } from "../../shared/payments";

export type PaymentMode = "sandbox" | "production";

export type ProviderConfigurationStatus = {
  provider: PaymentProviderId;
  configured: boolean;
  mode: PaymentMode;
  missing: string[];
};

const providerRequirements: Record<PaymentProviderId, string[]> = {
  visa_card: ["selected card processor/acquirer and its official merchant documentation"],
  nayapay: ["official NayaPay merchant API documentation and credentials"],
  easypaisa: ["official Easypaisa Online Payment Gateway documentation and credentials"],
  jazzcash: ["official JazzCash Online Payment Gateway documentation and credentials"],
};


export function getPaymentMode(env: NodeJS.ProcessEnv = process.env): PaymentMode {
  return env.PAYMENT_MODE === "production" ? "production" : "sandbox";
}

export function getProviderConfigurationStatus(
  provider: PaymentProviderId,
  env: NodeJS.ProcessEnv = process.env,
): ProviderConfigurationStatus {
  return {
    provider,
    configured: false,
    mode: getPaymentMode(env),
    missing: providerRequirements[provider],
  };
}

export function getAllProviderConfigurationStatuses(
  env: NodeJS.ProcessEnv = process.env,
): ProviderConfigurationStatus[] {
  return (Object.keys(providerRequirements) as PaymentProviderId[]).map((provider) =>
    getProviderConfigurationStatus(provider, env),
  );
}
