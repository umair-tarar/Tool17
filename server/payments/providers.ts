import type { CreditPackageId, PaymentCheckout, PaymentProviderId } from "../../shared/payments";
import { getProviderConfigurationStatus, type ProviderConfigurationStatus } from "./config";

export class ProviderNotReadyError extends Error {
  readonly code = "PAYMENT_PROVIDER_NOT_CONFIGURED" as const;

  constructor(public readonly provider: PaymentProviderId) {
    super("This payment provider is not configured with official merchant credentials and documentation.");
  }
}

export type CheckoutRequest = {
  purchaseId: string;
  reference: string;
  packageId: CreditPackageId;
  amount: string;
  currency: string;
  userId: string;
};

export type VerifiedPayment = {
  kind: "payment_succeeded";
  providerTransactionId: string;
  reference: string;
  amount: string;
  currency: string;
};

export type VerifiedPaymentReversal = {
  kind: "payment_reversed";
  providerTransactionId: string;
  reference: string;
};

export type VerifiedPaymentFailure = {
  kind: "payment_failed";
  providerTransactionId: string;
  reference: string;
};

export type VerifiedPaymentEvent = VerifiedPayment | VerifiedPaymentReversal | VerifiedPaymentFailure;

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  isReady(): boolean;
  getConfigurationStatus(): ProviderConfigurationStatus;
  createCheckout(request: CheckoutRequest): Promise<PaymentCheckout>;
  verifyWebhook(payload: Buffer, headers: Record<string, string | string[] | undefined>): Promise<VerifiedPaymentEvent>;
  getTransactionStatus(providerTransactionId: string): Promise<VerifiedPaymentEvent>;
  reverse(providerTransactionId: string): Promise<void>;
}

abstract class CredentialsGatedProvider implements PaymentProvider {
  abstract readonly id: PaymentProviderId;

  isReady() {
    return this.getConfigurationStatus().configured;
  }

  getConfigurationStatus() {
    return getProviderConfigurationStatus(this.id);
  }

  async createCheckout(_request: CheckoutRequest): Promise<PaymentCheckout> {
    throw new ProviderNotReadyError(this.id);
  }

  async verifyWebhook(_payload: Buffer, _headers: Record<string, string | string[] | undefined>): Promise<VerifiedPaymentEvent> {
    throw new ProviderNotReadyError(this.id);
  }

  async getTransactionStatus(_providerTransactionId: string): Promise<VerifiedPaymentEvent> {
    throw new ProviderNotReadyError(this.id);
  }

  async reverse(_providerTransactionId: string): Promise<void> {
    throw new ProviderNotReadyError(this.id);
  }
}

export class CardPaymentProvider extends CredentialsGatedProvider {
  readonly id = "visa_card" as const;
}

export class NayaPayProvider extends CredentialsGatedProvider {
  readonly id = "nayapay" as const;
}

export class EasypaisaProvider extends CredentialsGatedProvider {
  readonly id = "easypaisa" as const;
}

export class JazzCashProvider extends CredentialsGatedProvider {
  readonly id = "jazzcash" as const;
}

const providers: Record<PaymentProviderId, PaymentProvider> = {
  visa_card: new CardPaymentProvider(),
  nayapay: new NayaPayProvider(),
  easypaisa: new EasypaisaProvider(),
  jazzcash: new JazzCashProvider(),
};

export function getPaymentProvider(provider: PaymentProviderId) {
  return providers[provider];
}
