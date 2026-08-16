export const paymentProviders = ["visa_card", "nayapay", "easypaisa", "jazzcash"] as const;

export type PaymentProviderId = (typeof paymentProviders)[number];

export const creditPackages = {
  "10k": { credits: 10_000, amount: "15.00", currency: "USD" },
  "30k": { credits: 30_000, amount: "45.00", currency: "USD" },
  "50k": { credits: 50_000, amount: "80.00", currency: "USD" },
  "75k": { credits: 75_000, amount: "120.00", currency: "USD" },
  "100k": { credits: 100_000, amount: "150.00", currency: "USD" },
} as const;

export type CreditPackageId = keyof typeof creditPackages;

export type CreatePaymentRequest = {
  packageId: CreditPackageId;
  provider: PaymentProviderId;
};

export type PaymentCheckout = {
  kind: "redirect";
  url: string;
};
