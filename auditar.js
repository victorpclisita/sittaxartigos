export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { prompt, maxTokens = 4000, apiKey } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt é obrigatório" });

  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || `Erro Anthropic ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json({ texto: data.content?.[0]?.text?.trim() || "" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
