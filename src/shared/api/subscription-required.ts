// Callback global para redirigir a /upgrade cuando la API responde 402.
type SubscriptionRequiredHandler = (message: string) => void;

let handler: SubscriptionRequiredHandler | null = null;

export function setSubscriptionRequiredHandler(next: SubscriptionRequiredHandler | null) {
  handler = next;
}

export function notifySubscriptionRequired(message: string) {
  handler?.(message);
}
