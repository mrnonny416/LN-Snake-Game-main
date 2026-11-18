// lib/lnbits.ts

function getLNBitsConfig() {
  const apiUrl = (process.env.LNBITS_API_URL ?? process.env.NEXT_PUBLIC_LNBITS_API_URL)?.replace(
    /\/+$/,
    ""
  );
  const apiKey =
    process.env.LNBITS_INVOICE_KEY ??
    process.env.LNBITS_WALLET_READ_KEY ??
    process.env.NEXT_PUBLIC_LNBITS_WALLET_READ_KEY;

  if (!apiKey) {
    throw new Error("LNBITS_INVOICE_KEY is not set.");
  }
  if (!apiUrl) {
    throw new Error("LNBITS_API_URL is not set.");
  }

  return { apiUrl, apiKey };
}

const COMMON_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
};

async function parseResponse<T = unknown>(response: Response): Promise<T> {
  const text = await response.text();
  let data: Record<string, unknown>;

  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    const isHtml = text.trim().startsWith("<");
    const snippet = isHtml
      ? text
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 160)
      : text.slice(0, 160);

    throw new Error(
      `LNBits returned non-JSON response (${response.status}): ${snippet || "Empty response"}`
    );
  }

  if (!response.ok) {
    const detail =
      (typeof data?.detail === "string" && data.detail) ||
      (typeof data?.message === "string" && data.message) ||
      response.statusText;
    throw new Error(`LNBits error (${response.status}): ${detail}`);
  }

  return data as T;
}

// Function to create an LNBits invoice
export async function createLNBitsInvoice(amount: number, memo: string) {
  const { apiUrl, apiKey } = getLNBitsConfig();

  const payload = {
    out: false,
    amount: amount,
    memo: memo,
  };

  const response = await fetch(`${apiUrl}/payments`, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse<{ payment_hash: string; bolt11: string }>(response);

  if (!data.payment_hash || !data.bolt11) {
    throw new Error("LNBits returned unexpected response: missing payment_hash or bolt11.");
  }
  return data;
}

// Function to check LNBits payment status
export async function checkLNBitsPaymentStatus(paymentHash: string): Promise<boolean> {
  const { apiUrl, apiKey } = getLNBitsConfig();

  const response = await fetch(`${apiUrl}/payments/${paymentHash}`, {
    headers: {
      ...COMMON_HEADERS,
      "X-Api-Key": apiKey,
    },
  });

  const data = await parseResponse<{ paid: boolean }>(response);
  return data.paid === true;
}

// Function to get wallet details (e.g., balance)
export async function getLNBitsWalletDetails() {
  const { apiUrl, apiKey } = getLNBitsConfig();

  const response = await fetch(`${apiUrl}/wallet`, {
    headers: {
      ...COMMON_HEADERS,
      "X-Api-Key": apiKey,
    },
  });

  return await parseResponse<{ name: string; balance: number }>(response);
}
