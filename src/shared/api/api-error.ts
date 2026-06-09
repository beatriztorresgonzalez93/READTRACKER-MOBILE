export const SUBSCRIPTION_REQUIRED_CODE = "SUBSCRIPTION_REQUIRED";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  get isSubscriptionRequired(): boolean {
    return this.status === 402 && this.code === SUBSCRIPTION_REQUIRED_CODE;
  }
}
