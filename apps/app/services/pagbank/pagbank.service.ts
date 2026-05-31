export class PagBankService {
  private static baseUrl = process.env.PAGBANK_API_URL || "https://api.pagseguro.com.br";
  private static token = process.env.PAGBANK_TOKEN;

  static async createPixOrder(orderId: string, amount: number, customerName: string) {
    if (!this.token) throw new Error("PAGBANK_TOKEN não configurado");

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify({
        reference_id: orderId,
        customer: {
          name: customerName,
          email: "customer@email.com", // Obrigatório pela API do PagBank
          tax_id: "12345678909",       // CPF genérico para totens, se não coletado
          phones: [{ country: "55", area: "11", number: "999999999", type: "MOBILE" }]
        },
        qr_codes: [
          {
            amount: { value: Math.round(amount * 100) }, // Conversão para centavos
            expiration_date: new Date(Date.now() + 30 * 60000).toISOString(), // 30 min
          }
        ],
        notification_urls: [process.env.PAGBANK_WEBHOOK_URL]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ PagBank API Error:", JSON.stringify(errorData, null, 2));
      throw new Error("Erro ao gerar cobrança PIX no PagBank");
    }

    return response.json();
  }
}
