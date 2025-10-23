import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resendClient = apiKey ? new Resend(apiKey) : null;

export function ensureResendConfigured() {
  if (!resendClient) {
    throw new Error(
      "Resend is not configured. Set the RESEND_API_KEY environment variable."
    );
  }
}
