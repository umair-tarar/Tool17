# Payment provider integration prerequisites

All provider adapters remain intentionally disabled for the current manual-payment workflow. No provider is API-integrated, and no provider checkout, callback, status inquiry, refund, or void request is active.

## Runtime configuration

- `PAYMENT_MODE=sandbox` or `PAYMENT_MODE=production` controls the reported operating mode. It does not activate a provider.
- `SUPABASE_URL` or `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are required by the server purchase and fulfillment path.
- Payment credentials must remain server-only. Do not add them as `VITE_*` variables.

## Provider prerequisites

### Visa / debit bank card

Visa is a card network, not the selected checkout processor. Select a card processor or acquiring bank that supports hosted/tokenized card checkout and server-side verification. Obtain its official sandbox and production merchant documentation before defining `CARD_PROVIDER_*` variables or implementing the adapter.

Required decision: processor/acquirer name, checkout API, callback mechanism, transaction-status API, and refund API (if supported).

### NayaPay

Obtain NayaPay merchant onboarding and the official merchant/API documentation. Confirm the sandbox and production credentials, checkout initiation method, callback/webhook authentication, transaction-status operation, and refund/reversal support before defining `NAYAPAY_*` variables or implementing requests.

Status: ready for merchant API credentials/documentation; no assumptions are encoded.

### Easypaisa

Obtain the official Easypaisa Online Payment Gateway merchant documentation and sandbox/production onboarding details. Confirm credential names, checkout initiation, callback authentication, transaction-status operation, and refund/reversal support before defining `EASYPAISA_*` variables or implementing requests.

Status: ready for merchant API credentials/documentation; no assumptions are encoded.

### JazzCash

JazzCash uses the same manual workflow as the other payment methods. Admins configure the receiving account and instructions in the admin dashboard; users submit a transaction reference for review. No JazzCash API credentials, checkout endpoint, callback, status inquiry, refund, or void integration is required for the current workflow.

Status: manual verification only; not API-integrated.

## Activation rule

A provider must not be marked configured or live until its official merchant credentials are present, its documented checkout and verification flow is implemented, and sandbox/production tests have been completed for the selected mode.
