// lib/lnbits.ts

// Use server-only env vars; fall back to NEXT_PUBLIC_ for backward compatibility
const LNBITS_API_URL = process.env.LNBITS_API_URL ?? process.env.NEXT_PUBLIC_LNBITS_API_URL;
const LNBITS_INVOICE_KEY =
  process.env.LNBITS_INVOICE_KEY ??
  process.env.LNBITS_WALLET_READ_KEY ??
  process.env.NEXT_PUBLIC_LNBITS_WALLET_READ_KEY;

// Function to create an LNBits invoice
export async function createLNBitsInvoice(amount: number, memo: string) {
  if (!LNBITS_INVOICE_KEY) {
    throw new Error("LNBITS_INVOICE_KEY is not set.");
  }
  if (!LNBITS_API_URL) {
    throw new Error("LNBITS_API_URL is not set.");
  }

  const payload = {
    out: false,
    amount: amount,
    memo: memo,
  };

  const response = await fetch(`${LNBITS_API_URL}/payments`, {
    method: "POST",
    headers: {
      "X-Api-Key": LNBITS_INVOICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const detail = data?.detail ?? data?.message ?? response.statusText;
    throw new Error(`LNBits error (${response.status}): ${detail}`);
  }
  if (!data.payment_hash || !data.bolt11) {
    throw new Error("LNBits returned unexpected response: missing payment_hash or bolt11.");
  }
  return data as { payment_hash: string; bolt11: string };
}

// Function to check LNBits payment status
export async function checkLNBitsPaymentStatus(paymentHash: string): Promise<boolean> {
  if (!LNBITS_INVOICE_KEY) {
    throw new Error("LNBITS_INVOICE_KEY is not set.");
  }
  if (!LNBITS_API_URL) {
    throw new Error("LNBITS_API_URL is not set.");
  }

  const response = await fetch(`${LNBITS_API_URL}/payments/${paymentHash}`, {
    headers: {
      "X-Api-Key": LNBITS_INVOICE_KEY,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    const detail = data?.detail ?? data?.message ?? response.statusText;
    throw new Error(`LNBits error (${response.status}): ${detail}`);
  }
  return data.paid === true;
}

// Function to get wallet details (e.g., balance)
export async function getLNBitsWalletDetails() {
  if (!LNBITS_INVOICE_KEY) {
    throw new Error("LNBITS_INVOICE_KEY is not set.");
  }
  if (!LNBITS_API_URL) {
    throw new Error("LNBITS_API_URL is not set.");
  }

  const response = await fetch(`${LNBITS_API_URL}/wallet`, {
    headers: {
      "X-Api-Key": LNBITS_INVOICE_KEY,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    const detail = data?.detail ?? data?.message ?? response.statusText;
    throw new Error(`LNBits error (${response.status}): ${detail}`);
  }
  return data;
}
