import axios from "axios";

type DriverPushInput = {
  phone?: string | null;
  title: string;
  body: string;
  orderNumber?: string;
};

function buildHeaders() {
  const token = process.env.DRIVER_PUSH_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function pushDriverAlerts(input: DriverPushInput) {
  if (!input.phone) return;

  const whatsappUrl = process.env.DRIVER_WHATSAPP_WEBHOOK_URL;
  const smsUrl = process.env.DRIVER_SMS_WEBHOOK_URL;

  if (!whatsappUrl && !smsUrl) return;

  const message = `${input.title}\n${input.body}`;
  const payload = {
    to: input.phone,
    message,
    orderNumber: input.orderNumber ?? null
  };

  const requests: Promise<unknown>[] = [];
  const headers = buildHeaders();

  if (whatsappUrl) {
    requests.push(
      axios.post(
        whatsappUrl,
        {
          channel: "whatsapp",
          ...payload
        },
        { headers }
      )
    );
  }

  if (smsUrl) {
    requests.push(
      axios.post(
        smsUrl,
        {
          channel: "sms",
          ...payload
        },
        { headers }
      )
    );
  }

  const results = await Promise.allSettled(requests);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Driver push send failed", result.reason);
    }
  }
}
