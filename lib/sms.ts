import twilio from "twilio";

type SendArgs = {
  to: string;
  body: string;
};

// Fire-and-log SMS send. Caller MUST wrap in try/catch and never block
// customer experience on this. Returns true on success.
export async function sendSms({ to, body }: SendArgs): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    console.warn("[sms] Twilio not configured — skipping SMS send");
    return false;
  }
  if (!to) {
    console.warn("[sms] no `to` number set in settings — skipping SMS send");
    return false;
  }

  try {
    const client = twilio(sid, token);
    await client.messages.create({ from, to, body });
    return true;
  } catch (err) {
    console.error("[sms] send failed:", err);
    return false;
  }
}
