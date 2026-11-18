export async function checkAndMarkPayment(paymentHash: string) {
  try {
    const res = await fetch(`/api/payments/${paymentHash}/status`);
    if (!res.ok) {
      return false;
    }

    const data = (await res.json()) as { paid?: boolean; dbPaid?: boolean };
    const paid = data.paid === true;
    const dbPaid = data.dbPaid === true;

    return paid && dbPaid;
  } catch (error) {
    console.error("Error checking payment:", error);
    return false;
  }
}

export function startPaymentPoller(
  paymentHash: string,
  onPaid: () => void,
  intervalMs: number = 2000,
  maxAttempts: number = 150 // ~5 minutes
) {
  let attempts = 0;
  const pollInterval = setInterval(async () => {
    attempts++;
    const paid = await checkAndMarkPayment(paymentHash);
    if (paid || attempts >= maxAttempts) {
      clearInterval(pollInterval);
      if (paid) onPaid();
    }
  }, intervalMs);

  return () => clearInterval(pollInterval);
}
