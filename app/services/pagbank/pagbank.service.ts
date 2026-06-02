export class PagBankService {
  private static baseUrl = process.env.PAGBANK_API_URL?.replace(/\/+$/, "");
  private static token = process.env.PAGBANK_TOKEN?.trim();
  private static webhookUrl = process.env.PAGBANK_WEBHOOK_URL;

  static async createPixOrder(
    orderId: string,
    amount: number,
    customerName: string
  ) {
    if (!this.baseUrl) {
      throw new Error("PAGBANK_API_URL não configurada");
    }

    if (!this.token) {
      throw new Error("PAGBANK_TOKEN não configurado");
    }

    const payload = {
      reference_id: orderId,
      customer: {
        name: customerName || "Cliente Teste",
        email: "cliente.teste@exemplo.com",
        tax_id: "12345678909",
        phones: [
          {
            country: "55",
            area: "11",
            number: "999999999",
            type: "MOBILE"
          }
        ]
      },
      qr_codes: [
        {
          amount: {
            value: Math.round(amount * 100)
          },
          expiration_date: new Date(
            Date.now() + 30 * 60 * 1000
          ).toISOString()
        }
      ]
    };

    if (this.webhookUrl) {
      Object.assign(payload, {
        notification_urls: [this.webhookUrl]
      });
    }

    console.log("=== PAGBANK REQUEST ===");
    console.log("URL:", `${this.baseUrl}/orders`);
    console.log("PAYLOAD:");
    console.log(JSON.stringify(payload, null, 2));

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();

    console.log("=== PAGBANK RESPONSE ===");
    console.log("STATUS:", response.status);
    console.log("BODY:", responseText);

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }

    if (!response.ok) {
      throw new Error(
        `PagBank Error (${response.status}): ${JSON.stringify(data, null, 2)}`
      );
    }

    return data;
  }
}