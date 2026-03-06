import { useState, useRef, useEffect } from "react";

// ─── PROMPTS ──────────────────────────────────────────────────────────────────

const PROMPTS = {

  pesquisa: (tema) => `Você é especialista em SEO e conteúdo tributário/fiscal brasileiro.
TEMA: "${tema}"

IMPORTANTE: Responda SOMENTE com o JSON abaixo preenchido. Nenhum texto antes ou depois. Nenhum bloco de código. Apenas o JSON puro.

{
  "keyword_primaria": "keyword estratégica de 1-4 palavras para o tema",
  "keywords_secundarias": ["keyword lsi 1", "keyword lsi 2", "keyword lsi 3", "keyword lsi 4", "keyword lsi 5", "keyword lsi 6"],
  "intencao_busca": "Informacional",
  "angulo_diferenciado": "ângulo específico que diferencia este artigo de concorrentes genéricos",
  "secoes": [
    { "h2": "Título da seção 1", "h3s": ["subtópico a", "subtópico b"], "foco": "o que abordar nesta seção" },
    { "h2": "Título da seção 2", "h3s": [], "foco": "o que abordar nesta seção" },
    { "h2": "Título da seção 3", "h3s": [], "foco": "o que abordar nesta seção" }
  ],
  "faq_perguntas": ["Pergunta real 1?", "Pergunta real 2?", "Pergunta real 3?", "Pergunta real 4?"],
  "meta_title": "title tag até 60 caracteres com keyword",
  "meta_description": "meta description até 155 caracteres",
  "slug": "slug-com-keyword",
  "fontes_primarias": ["Lei ou norma 1", "Lei ou norma 2"]
}`,

  // Parte 1: corpo principal (intro + seções) — ~750 palavras
  corpo: (tema, p) => `Você é redator especialista da Sittax, consultoria tributária brasileira.
Escreva como contador experiente. NUNCA use linguagem de IA.

TEMA: "${tema}"
KEYWORD PRIMÁRIA: "${p.keyword_primaria}"
KEYWORDS SECUNDÁRIAS: ${p.keywords_secundarias.join(", ")}
ÂNGULO: ${p.angulo_diferenciado}
FONTES PRIMÁRIAS: ${p.fontes_primarias.join("; ")}
SEÇÕES A ESCREVER:
${p.secoes.map((s, i) => `${i + 1}. H2: "${s.h2}" — Foco: ${s.foco}${s.h3s.length ? "\n   H3s: " + s.h3s.join(", ") : ""}`).join("\n")}

REGRAS OBRIGATÓRIAS:
- Escreva APENAS: título H1 + introdução + as ${p.secoes.length} seções H2 acima
- NÃO inclua FAQ, conclusão nem CTA — serão escritos separadamente
- Introdução: 2-3 frases diretas com a keyword primária. Sem rodeios.
- Cada H2: máximo 3 parágrafos de 2 linhas cada. Seja denso e direto.
- Ao menos 1 dado numérico por seção H2 (alíquota, prazo, valor, percentual)
- Cite as fontes primárias naturalmente (ex: "conforme a Lei Complementar 123/2006")
- NUNCA cite leis que não existem com certeza — use "conforme a legislação tributária vigente" quando em dúvida
- PROIBIDO: "No cenário atual", "É crucial", "Vale ressaltar", "Neste contexto", "Abrangente", "Robusto", "Em suma", "Transformador", "Mergulhe", "Navegar"
- Meta: ~750 palavras nesta parte

REGRA DE VOZ ATIVA (obrigatório):
- Escreva SEMPRE na voz ativa. Máximo 10% das frases podem estar na voz passiva.
- ERRADO (passiva): "o imposto é calculado pela Receita", "as alíquotas foram definidas pela lei"
- CERTO (ativa): "a Receita calcula o imposto", "a lei definiu as alíquotas"

REGRA DE PALAVRAS DE TRANSIÇÃO (obrigatório):
- Pelo menos 30% das frases devem começar ou conter uma palavra/expressão de transição.
- Use naturalmente: portanto, assim, além disso, no entanto, por isso, dessa forma, ou seja, ainda assim, conforme, por outro lado, já que, uma vez que, bem como, em seguida, por exemplo, contudo, todavia, inclusive, pois, logo, apesar disso, de fato, ao mesmo tempo, mesmo que

FORMATO EXATO:
# [Título H1 com keyword]

[Introdução: 2-3 frases]

## [H2 da seção 1]
[conteúdo — máx 3 parágrafos curtos]

## [H2 da seção 2]
[conteúdo — máx 3 parágrafos curtos]

## [H2 da seção 3]
[conteúdo — máx 3 parágrafos curtos]`,

  // Parte 2: FAQ — ~280 palavras
  faq: (tema, p, corpo) => `Você é redator especialista da Sittax, consultoria tributária brasileira.

CONTEXTO: Artigo sobre "${tema}" (keyword: "${p.keyword_primaria}")
Início do artigo: ${corpo.slice(0, 250)}...

PERGUNTAS:
${p.faq_perguntas.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Escreva SOMENTE a seção FAQ com estas 4 perguntas.
- Respostas diretas, 2 frases cada (não mais que isso)
- Tom de contador experiente, sem linguagem de IA
- Dados concretos quando aplicável
- NUNCA cite leis sem certeza — use "conforme a legislação vigente" se em dúvida

FORMATO EXATO:
## Perguntas Frequentes

### [Pergunta 1]

[Resposta em 2 frases]

### [Pergunta 2]

[Resposta em 2 frases]

### [Pergunta 3]

[Resposta em 2 frases]

### [Pergunta 4]

[Resposta em 2 frases]`,

  // Parte 3: Conclusão — ~120 palavras
  conclusao: (tema, p) => `Escreva SOMENTE a seção de conclusão para um artigo da Sittax sobre "${tema}".

Regras:
- Título H2: "Conclusão"
- 2 parágrafos curtos (2 linhas cada)
- Primeiro parágrafo: síntese do que foi abordado no artigo, com tom prático
- Segundo parágrafo: o que o leitor deve fazer agora como próximo passo concreto
- Linguagem direta de contador, sem clichês
- PROIBIDO: "Em suma", "Por fim", "Concluindo", "Portanto", "Em conclusão"

FORMATO EXATO:
## Conclusão

[Parágrafo 1: síntese prática]

[Parágrafo 2: próximo passo concreto]`,

  // Parte 4: CTA — ~80 palavras
  cta: (tema, p) => `Escreva SOMENTE um parágrafo de CTA para um artigo da Sittax sobre "${tema}".

Regras:
- 2-3 frases, tom consultivo e direto
- Convide o leitor a falar com a Sittax para analisar o caso específico
- Mencione que cada empresa tem uma situação única
- PROIBIDO: "Em suma", "Por fim", "Concluindo", "Portanto", "Transforme"
- Comece com uma frase sobre o impacto prático do tema

Retorne apenas o parágrafo, sem título, sem marcadores.`,

  // Etapa de polimento Yoast — corrige transição e voz passiva antes da auditoria
  polimento: (textoCompleto) => `Você é revisor especialista em legibilidade de textos em português brasileiro.

Sua única tarefa é reescrever o artigo abaixo para atingir dois critérios obrigatórios:

CRITÉRIO 1 — PALAVRAS DE TRANSIÇÃO (meta: ≥ 30% das frases)
Percorra cada frase do artigo. Se menos de 30% delas contiver uma palavra/expressão de transição, adicione conectivos naturais nas frases que estiverem "soltas".
Palavras válidas (use com naturalidade): portanto, assim, além disso, no entanto, por isso, dessa forma, ou seja, ainda assim, conforme, por outro lado, já que, uma vez que, bem como, em seguida, por exemplo, contudo, todavia, inclusive, pois, logo, apesar disso, de fato, ao mesmo tempo, mesmo que, anteriormente, posteriormente, igualmente, salvo, sobretudo, certamente, então, entretanto, ademais, aliás, afinal, principalmente

CRITÉRIO 2 — VOZ ATIVA (meta: ≤ 10% das frases em voz passiva)
Identifique frases com construções passivas (ser/estar/foi/são/foram/será/serão + particípio) e reescreva-as na voz ativa.
- "o imposto é calculado pela Receita" → "a Receita calcula o imposto"
- "as alíquotas foram aprovadas pelo Congresso" → "o Congresso aprovou as alíquotas"
- "a declaração deve ser entregue" → "o contribuinte deve entregar a declaração"

REGRAS:
- Preserve todo o conteúdo, dados, links e estrutura de títulos (# ## ###)
- Preserve todos os links markdown [texto](url) exatamente como estão
- Não corte nenhuma seção
- Não altere fatos, números, leis ou nomes
- Não adicione nem remova seções
- As mudanças devem soar naturais — nunca mecânicas ou forçadas

Retorne APENAS o artigo completo reescrito, com todos os marcadores # ## ###.
Sem explicações, sem comentários fora do artigo.

ARTIGO:
${textoCompleto}`,

  auditoria: (textoCompleto, rodada) => `Você é editor-chefe de conteúdo tributário brasileiro. Audite este artigo com rigor — rodada ${rodada} de revisão.

ARTIGO COMPLETO:
${textoCompleto}

═══════════════════════════════════════════
CRITÉRIO A — CONTEÚDO E ESTRUTURA
═══════════════════════════════════════════
1. LEGISLAÇÃO: cite apenas leis com certeza absoluta. Se não tiver certeza, marque como problema.
2. COMPLETUDE: todas as seções H2 devem ter conteúdo completo, sem corte no meio.
3. LINGUAGEM IA: frases que soam como IA ("no cenário atual", "é crucial", "vale ressaltar", "robusto", "abrangente", "transformador", linguagem corporativa vaga) são problemas.
4. DADOS: números e percentuais sem fonte identificável são problema.
5. FAQ: deve ter exatamente 4 perguntas com respostas completas.
6. CONCLUSÃO: deve ter seção H2 "Conclusão" com 2 parágrafos.
7. CTA: deve ter parágrafo final convidando a falar com a Sittax.

═══════════════════════════════════════════
CRITÉRIO B — PALAVRAS DE TRANSIÇÃO (Yoast)
═══════════════════════════════════════════
META: mínimo 30% das frases devem conter pelo menos uma palavra de transição.
- Verde (ok): ≥ 30% das frases
- Laranja (atenção): entre 20% e 30%
- Vermelho (problema): < 20% das frases

LISTA COMPLETA DE PALAVRAS DE TRANSIÇÃO VÁLIDAS:
Palavras simples: ademais, afinal, aliás, analogamente, anteriormente, assim, atualmente, certamente, conforme, conquanto, contudo, decerto, embora, enfim, enquanto, então, entretanto, eventualmente, igualmente, inegavelmente, inesperadamente, mas, ocasionalmente, outrossim, pois, porquanto, porque, portanto, posteriormente, precipuamente, primeiramente, primordialmente, principalmente, salvo, semelhantemente, similarmente, sobretudo, surpreendentemente, todavia, logo, inclusive

Expressões compostas: a fim de, a fim de que, a menos que, a princípio, a saber, acima de tudo, ainda assim, ainda mais, ainda que, além disso, antes de mais nada, antes de tudo, antes que, ao mesmo tempo, ao passo que, ao propósito, apesar de, apesar disso, às vezes, assim como, assim que, assim sendo, assim também, bem como, com a finalidade de, com efeito, com o fim de, com o intuito de, com o propósito de, com toda a certeza, como resultado, como se, da mesma forma, de acordo com, de conformidade com, de fato, de maneira idêntica, de tal forma que, de tal sorte que, depois que, desde que, dessa forma, dessa maneira, desse modo, do mesmo modo, é provável, em conclusão, em contrapartida, em contraste com, em outras palavras, em primeiro lugar, em princípio, em resumo, em seguida, em segundo lugar, em síntese, em suma, em terceiro lugar, em virtude de, finalmente, isto é, já que, juntamente com, logo após, logo depois, logo que, mesmo que, não apenas, nesse hiato, nesse ínterim, nesse meio tempo, nesse sentido, no entanto, no momento em que, ou por outra, ou seja, para que, pelo contrário, por analogia, por causa de, por certo, por conseguinte, por consequência, porém, por exemplo, por fim, por isso, por mais que, por menos que, por outro lado, por vezes, posto que, se acaso, se bem que, seja como for, sem dúvida, sempre que, só que, sob o mesmo ponto de vista, tanto quanto, todas as vezes que, uma vez que, visto que, de repente, não obstante, de qualquer forma, em geral, geralmente, devido a, em razão de, de forma que, de modo que

COMO CALCULAR:
1. Conte o total de frases do artigo (separe por "." "!" "?")
2. Para cada frase, verifique se contém alguma das palavras/expressões acima
3. Calcule: (frases com transição / total de frases) × 100
4. Reporte o percentual e a classificação (verde/laranja/vermelho)
5. Se laranja ou vermelho, liste exemplos de frases sem transição que poderiam receber uma

═══════════════════════════════════════════
CRITÉRIO C — VOZ PASSIVA (Yoast)
═══════════════════════════════════════════
META: máximo 10% das frases podem estar na voz passiva.
- Verde (ok): ≤ 10% das frases em voz passiva
- Vermelho (problema): > 10% das frases em voz passiva

Voz passiva em português: construções com "ser/estar/foi/são/foram/será/serão + particípio" (ex: "é definido", "foram aprovadas", "será regulamentado").

COMO CALCULAR:
1. Identifique frases com construções passivas
2. Calcule: (frases passivas / total de frases) × 100
3. Reporte o percentual e a classificação
4. Se vermelho, liste as frases passivas que devem ser reescritas na voz ativa

═══════════════════════════════════════════
ATENÇÃO FINAL
═══════════════════════════════════════════
- "aprovado" só pode ser true se score_geral >= 90
- Score abaixo de 90 significa que há pelo menos um problema crítico nos critérios A, B ou C

Responda SOMENTE em JSON válido, sem markdown:
{
  "score_geral": 87,
  "aprovado": false,
  "problemas": [
    "Problemas concretos. Ex: 'LC 214/2025 não existe', 'Conclusão ausente', 'Apenas 18% das frases têm transição — abaixo do mínimo de 30%', 'Voz passiva em 15% das frases — acima do limite de 10%: [lista as frases]'. Array vazio [] se não houver."
  ],
  "checklist": {
    "h1_com_keyword": true,
    "introducao_direta": true,
    "dados_numericos": true,
    "legislacao_verificavel": true,
    "faq_completo_4_perguntas": true,
    "conclusao_presente": true,
    "cta_presente": true,
    "sem_linguagem_ia": true,
    "todas_secoes_completas": true,
    "transicao_yoast_verde": true,
    "voz_passiva_yoast_verde": true
  },
  "yoast": {
    "total_frases": 45,
    "frases_com_transicao": 15,
    "percentual_transicao": 33,
    "status_transicao": "verde",
    "frases_passivas": 3,
    "percentual_passiva": 7,
    "status_passiva": "verde"
  },
  "resumo": "Veredicto objetivo em 1-2 frases"
}`,

  // Etapa de linkagem — identifica leis/pesquisas/dados e insere links reais
  linkagem: (textoCompleto) => `Você é especialista em fontes do direito tributário brasileiro e pesquisas econômicas.

Analise o artigo abaixo e faça duas coisas:

1. IDENTIFIQUE todas as menções a:
   - Leis, Leis Complementares, Instruções Normativas, Resoluções, Decretos
   - Percentuais, alíquotas, dados numéricos com fonte implícita
   - Pesquisas, estudos ou estatísticas citadas

2. PARA CADA ITEM, verifique se a lei/fonte realmente existe e encontre a URL oficial:
   - Leis federais → planalto.gov.br/ccivil_03/leis/ ou lexml.gov.br
   - Instruções Normativas RFB → normas.receita.fazenda.gov.br
   - IBGE, Sebrae, IBPT, CNI → sites oficiais dessas entidades
   - SE NÃO TIVER CERTEZA da existência da lei ou da URL correta, NÃO insira o link — remova a referência ou substitua por "conforme a legislação tributária vigente"

3. REESCREVA o artigo inserindo os links no formato markdown: [texto âncora](URL)
   - O texto âncora deve ser a palavra ou expressão mais específica (ex: [Lei Complementar 123/2006](https://...))
   - Máximo 1 link por lei/fonte — não repetir links da mesma fonte
   - Links só onde há certeza absoluta da URL

Retorne APENAS o artigo completo reescrito com os links inseridos, mantendo todos os marcadores # ## ###.
Não adicione explicações, cabeçalhos ou texto fora do artigo.

ARTIGO:
${textoCompleto}`,

  // Etapa de links internos — busca artigos do blog Sittax e linka palavras relevantes
  linksInternos: (textoCompleto, tema) => `Você é especialista em SEO e conteúdo da Sittax. Sua tarefa é inserir links internos do blog da Sittax (sittax.com.br/blog/) no artigo abaixo.

PASSO 1 — Use web_search para buscar artigos relevantes do blog Sittax:
- Faça buscas como: site:sittax.com.br/blog [termo do tema]
- Termos a buscar baseados no tema "${tema}": use 3-4 variações de keywords relevantes
- Colete os URLs reais encontrados e os títulos dos artigos

PASSO 2 — Para cada artigo encontrado com URL real e confirmado:
- Identifique no texto abaixo uma palavra ou expressão que seja o âncora ideal para aquele link
- O âncora deve ser natural, específico e relevante (ex: "Simples Nacional", "reforma tributária", "ICMS-ST", "recuperação de créditos tributários")
- Insira o link no formato markdown: [âncora](https://sittax.com.br/blog/...)

REGRAS:
- Máximo 4 links internos no total
- Nunca repita o mesmo URL
- Só insira links de artigos que você realmente encontrou via web_search — NUNCA invente URLs
- O âncora deve aparecer naturalmente na frase, sem forçar
- Não altere nenhuma outra parte do texto — apenas insira os links nos locais exatos
- Preserve todos os links externos já existentes no texto (fontes de legislação etc.)

Retorne APENAS o artigo completo com os links internos inseridos, mantendo todos os marcadores # ## ###.
Não adicione explicações nem texto fora do artigo.

ARTIGO:
${textoCompleto}`,

  revisar: (textoCompleto, problemas) => `Você é redator especialista da Sittax. Reescreva o artigo abaixo corrigindo TODOS os problemas listados.

PROBLEMAS A CORRIGIR:
${problemas.map((p, i) => `${i + 1}. ${p}`).join("\n")}

REGRAS DA REESCRITA:
- Corrija cada problema listado acima
- NUNCA invente ou cite leis que você não tem certeza que existem. Use "conforme a legislação tributária vigente" quando em dúvida
- Mantenha toda a estrutura de títulos (# ## ###) e o tamanho aproximado
- Não corte nenhuma seção — todas devem ter conteúdo completo
- Mantenha FAQ com 4 perguntas, Conclusão e CTA no final
- Linguagem de contador experiente, direta, sem marcadores de IA

SE HOUVER PROBLEMA DE PALAVRAS DE TRANSIÇÃO (meta: ≥ 30% das frases):
- Adicione conectivos naturais no início ou meio de frases que estejam isoladas
- Use palavras da lista: portanto, assim, além disso, no entanto, por isso, dessa forma, ou seja, ainda assim, conforme, por outro lado, já que, uma vez que, bem como, em seguida, por exemplo, contudo, todavia, inclusive, pois, logo
- Não force — insira apenas onde a transição for natural e melhore a leitura

SE HOUVER PROBLEMA DE VOZ PASSIVA (meta: ≤ 10% das frases):
- Reescreva as frases passivas identificadas na voz ativa
- Ex: "o imposto é calculado pela Receita" → "a Receita calcula o imposto"
- Ex: "as alíquotas foram definidas pela lei" → "a lei definiu as alíquotas"

ARTIGO ORIGINAL:
${textoCompleto}

Retorne o artigo completo corrigido, com todos os marcadores de formatação (# ## ###).`,
};

// ─── API (chama o backend via URL relativa — funciona local e no Vercel) ─────

async function callGroq(prompt, maxTokens) {
  const res = await fetch("/api/gerar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, maxTokens }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Erro no servidor (${res.status})`);
  }
  const data = await res.json();
  return data.texto || "";
}

// Etapas de fontes/links — com web_search no backend
async function callGroqComSearch(prompt, maxTokens) {
  const res = await fetch("/api/pesquisar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, maxTokens }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Erro no servidor (${res.status})`);
  }
  const data = await res.json();
  return data.texto || "";
}

// Pausa com countdown visível no log da UI
const pausa = (seg, motivo, logFn) => new Promise(resolve => {
  if (logFn) logFn(`⏳ Aguardando ${seg}s (limite de tokens)...`, "info");
  setTimeout(resolve, seg * 1000);
});

function parseJSON(text) {
  if (!text) return null;
  // 1. Limpar blocos de código markdown
  let clean = text.replace(/```json|```/g, "").trim();
  // 2. Tentar parse direto
  try { return JSON.parse(clean); } catch (_) { }
  // 3. Extrair o primeiro bloco { ... } encontrado no texto
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (_) { }
  }
  // 4. Falhou — retornar null com log
  console.error("parseJSON falhou. Texto recebido:", text.slice(0, 500));
  return null;
}

function contarPalavras(texto) {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Gerador HTML para download ───────────────────────────────────────────────

function escHtml(s) {
  if (!s) return "";
  // 1. Escapar caracteres especiais HTML (exceto & que pode vir de links)
  let r = s
    .replace(/&(?![a-zA-Z0-9#]+;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // 2. Negrito e itálico
  r = r
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
  // 3. Links markdown [texto](url) → <a href="url" target="_blank">texto</a>
  //    Processar ANTES de outros escapes para não quebrar URLs
  r = r.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    (_, texto, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8;text-decoration:underline;">${texto}</a>`
  );
  return r;
}

function gerarHtml(artigo, pesquisa) {
  const lines = artigo.split("\n");
  const parts = [];

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("### ")) parts.push(`<h3>${escHtml(t.slice(4).trim())}</h3>`);
    else if (t.startsWith("## ")) parts.push(`<h2>${escHtml(t.slice(3).trim())}</h2>`);
    else if (t.startsWith("# ")) parts.push(`<h1>${escHtml(t.slice(2).trim())}</h1>`);
    else if (/^[-*]\s/.test(t)) parts.push(`<li>${escHtml(t.slice(2).trim())}</li>`);
    else if (t) parts.push(`<p>${escHtml(t)}</p>`);
  }

  const body = parts.join("\n").replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>\n${m}</ul>\n`);

  const p = pesquisa || {};
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escHtml(p.meta_title || p.keyword_primaria || "Artigo Sittax")}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.72;color:#1f2937;max-width:780px;margin:0 auto;padding:40px 48px}
    .meta{background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:14px 18px;margin-bottom:32px;font-size:9pt;line-height:2}
    .ml{font-weight:700;color:#1d4ed8}
    .aviso{background:#fef3c7;border:1px solid #fde68a;border-radius:6px;padding:12px 16px;margin-bottom:24px;font-size:10.5pt;color:#92400e}
    h1{font-size:20pt;font-weight:700;color:#111827;line-height:1.25;margin-bottom:18px;padding-bottom:12px;border-bottom:2.5px solid #1d4ed8}
    h2{font-size:13.5pt;font-weight:700;color:#1d4ed8;margin-top:30px;margin-bottom:10px}
    h3{font-size:11pt;font-weight:700;color:#374151;margin-top:16px;margin-bottom:6px}
    p{margin-bottom:11px;text-align:justify}
    a{color:#1d4ed8;text-decoration:underline}
    a:hover{color:#1e40af}
    ul{margin:8px 0 14px 24px}
    li{margin-bottom:6px}
    @page{margin:2cm 2.2cm;size:A4}
    @media print{body{padding:0}.aviso{display:none}h1,h2{page-break-after:avoid}p,li{orphans:3;widows:3}}
  </style>
</head>
<body>
  <div class="aviso"><strong>Para salvar como PDF:</strong> pressione <strong>Ctrl+P</strong> → destino <strong>"Salvar como PDF"</strong> → Salvar.</div>
  <div class="meta">
    <div style="font-weight:700;color:#1d4ed8;font-size:8pt;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Metadados para o WordPress</div>
    ${p.meta_title ? `<div><span class="ml">Meta Title:</span> ${escHtml(p.meta_title)}</div>` : ""}
    ${p.meta_description ? `<div><span class="ml">Meta Desc:</span> ${escHtml(p.meta_description)}</div>` : ""}
    ${p.slug ? `<div><span class="ml">Slug:</span> ${escHtml(p.slug)}</div>` : ""}
    ${p.keyword_primaria ? `<div><span class="ml">Keyword:</span> ${escHtml(p.keyword_primaria)}</div>` : ""}
    ${p.keywords_secundarias ? `<div><span class="ml">Keywords sec.:</span> ${p.keywords_secundarias.join(", ")}</div>` : ""}
  </div>
  ${body}
</body>
</html>`;
}

function baixarHtml(artigo, pesquisa) {
  const html = gerarHtml(artigo, pesquisa);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sittax-${(pesquisa?.slug || "artigo").replace(/\s+/g, "-").toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

const BRAND = {
  primary: "#F26B37",
  primaryDark: "#D4501E",
  primaryLight: "#FEF0EA",
  primaryBorder: "#FAC4A8",
  bg: "#FAFAFA",
  card: "#FFFFFF",
  border: "#E8E8E8",
  text: "#1A1A1A",
  textMuted: "#6B6B6B",
  textLight: "#9E9E9E",
  success: "#1A7F4B",
  successBg: "#EDFAF3",
  successBorder: "#A3E4C1",
  warn: "#7A4F00",
  warnBg: "#FFF8E6",
  warnBorder: "#F5D589",
  error: "#B91C1C",
  errorBg: "#FEF2F2",
  errorBorder: "#FECACA",
  font: "'Inter', system-ui, sans-serif",
  radius: "4px",
  radiusMd: "6px",
  radiusLg: "8px",
};

const FASES = [
  { id: "pesquisa", label: "Pesquisa", icon: "🔍" },
  { id: "corpo", label: "Corpo", icon: "✍️" },
  { id: "faq", label: "FAQ", icon: "❓" },
  { id: "cta", label: "Concl./CTA", icon: "🎯" },
  { id: "polimento", label: "Polimento", icon: "✨" },
  { id: "auditoria1", label: "Auditoria 1", icon: "🔎" },
  { id: "revisao1", label: "Revisão 1", icon: "🛠️" },
  { id: "fontes", label: "Fontes", icon: "🔗" },
  { id: "links_internos", label: "Links Int.", icon: "🏠" },
  { id: "auditoria2", label: "Auditoria 2", icon: "🔎" },
  { id: "revisao2", label: "Revisão 2", icon: "🛠️" },
  { id: "auditoria3", label: "Auditoria 3", icon: "🔎" },
  { id: "revisao3", label: "Revisão 3", icon: "✅" },
  { id: "pronto", label: "Pronto", icon: "🎉" },
];

export default function App() {
  const [tema, setTema] = useState("");
  const [fase, setFase] = useState("idle");
  const [log, setLog] = useState([]);
  const [pesquisa, setPesquisa] = useState(null);
  const [artigo, setArtigo] = useState("");
  const [audit, setAudit] = useState(null);
  const [erro, setErro] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const log_ = (msg, tipo = "info") =>
    setLog(prev => [...prev, { msg, tipo, ts: new Date().toLocaleTimeString("pt-BR") }]);

  async function gerar() {
    if (!tema.trim()) return;
    setLog([]); setErro(""); setArtigo("");
    setPesquisa(null); setAudit(null);

    try {
      setFase("pesquisa");
      log_("Definindo estratégia de keywords e estrutura...");
      const rawP = await callGroq(PROMPTS.pesquisa(tema), 1500);
      const pd = parseJSON(rawP);
      if (!pd) throw new Error(`Resposta inválida da API na pesquisa. Conteúdo: "${rawP.slice(0, 120)}..."`);
      if (!pd.keyword_primaria) throw new Error("JSON retornado sem campo 'keyword_primaria'. Tente novamente.");

      pd.keywords_secundarias = pd.keywords_secundarias || [];
      pd.secoes = pd.secoes || [
        { h2: `O que é ${tema}`, h3s: [], foco: "Explicar o conceito e contexto" },
        { h2: `Como funciona na prática`, h3s: [], foco: "Aplicação prática e exemplos" },
        { h2: `Impacto para empresas`, h3s: [], foco: "Consequências e cuidados" },
      ];
      pd.faq_perguntas = pd.faq_perguntas || [
        `O que muda com ${tema}?`, `Quais empresas são afetadas?`,
        `Qual o prazo para adequação?`, `Como a Sittax pode ajudar?`,
      ];
      pd.fontes_primarias = pd.fontes_primarias || ["Legislação tributária vigente"];
      pd.meta_title = pd.meta_title || `${tema} — Guia Completo | Sittax`.slice(0, 60);
      pd.meta_description = pd.meta_description || `Entenda ${tema} com clareza. A Sittax explica o impacto para sua empresa.`.slice(0, 155);
      pd.slug = pd.slug || tema.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);

      setPesquisa(pd);
      log_(`✓ Keyword: "${pd.keyword_primaria}"`, "ok");
      log_(`✓ Intenção: ${pd.intencao_busca || "Informacional"}`, "ok");
      log_(`✓ ${pd.secoes.length} seções + ${pd.faq_perguntas.length} FAQs planejados`, "ok");

      setFase("corpo");
      log_("Escrevendo introdução e seções principais...");
      await pausa(8, "", log_);
      const corpoPart = await callGroq(PROMPTS.corpo(tema, pd), 2500);
      if (corpoPart.length < 400) throw new Error("Corpo do artigo muito curto. Tente um tema mais específico.");
      log_(`✓ Corpo: ~${contarPalavras(corpoPart)} palavras`, "ok");

      setFase("faq");
      log_("Escrevendo seção de Perguntas Frequentes...");
      await pausa(12, "", log_);
      const faqPart = await callGroq(PROMPTS.faq(tema, pd, corpoPart), 900);
      if (faqPart.length < 100) throw new Error("FAQ não gerado corretamente.");
      log_(`✓ FAQ: ~${contarPalavras(faqPart)} palavras`, "ok");

      setFase("cta");
      log_("Escrevendo conclusão...");
      await pausa(10, "", log_);
      const conclusaoPart = await callGroq(PROMPTS.conclusao(tema, pd), 400);
      log_(`✓ Conclusão: ~${contarPalavras(conclusaoPart)} palavras`, "ok");

      log_("Escrevendo CTA...");
      await pausa(8, "", log_);
      const ctaPart = await callGroq(PROMPTS.cta(tema, pd), 300);
      log_(`✓ CTA: ~${contarPalavras(ctaPart)} palavras`, "ok");

      const textoCompleto = `${corpoPart}\n\n${faqPart}\n\n${conclusaoPart}\n\n${ctaPart}`;
      setArtigo(textoCompleto);
      log_(`✓ Total montado: ${contarPalavras(textoCompleto)} palavras`, "ok");

      let textoFinal = textoCompleto;
      let auditFinal = null;

      setFase("polimento");
      log_("Polindo transição e voz ativa (critérios Yoast)...");
      await pausa(20, "", log_);
      try {
        const polido = await callGroq(PROMPTS.polimento(textoCompleto), 6000);
        if (polido?.length > 500) {
          textoFinal = polido; setArtigo(polido);
          log_(`✓ Polimento aplicado — ${contarPalavras(polido)} palavras`, "ok");
        } else {
          log_("⚠ Polimento retornou texto muito curto, mantendo original.", "warn");
        }
      } catch (e) {
        log_(`⚠ Polimento falhou (${e.message}). Continuando.`, "warn");
      }

      for (let rodada = 1; rodada <= 3; rodada++) {
        setFase(`auditoria${rodada}`);
        log_(`Auditoria ${rodada}/3 — verificando qualidade, Yoast e linguagem...`);
        await pausa(20, "", log_);
        const rawA = await callGroq(PROMPTS.auditoria(textoFinal, rodada), 1500);
        const ad = parseJSON(rawA);
        if (!ad) { log_(`⚠ Auditoria ${rodada} não retornou JSON válido, pulando.`, "warn"); break; }
        auditFinal = ad;

        const yoastOk = !ad.yoast || (ad.yoast.status_transicao === "verde" && ad.yoast.status_passiva === "verde");
        const scoreSuficiente = ad.score_geral >= 90 && yoastOk;

        log_(
          `✓ Score rodada ${rodada}: ${ad.score_geral}/100` +
          (ad.yoast ? ` | Transição: ${ad.yoast.percentual_transicao}% (${ad.yoast.status_transicao}) | Voz passiva: ${ad.yoast.percentual_passiva}% (${ad.yoast.status_passiva})` : "") +
          (scoreSuficiente ? " — aprovado ✓" : " — revisando..."),
          scoreSuficiente ? "ok" : "warn"
        );

        const problemas = (ad.problemas || []).filter(p => p?.trim() && p.length > 5);
        if (scoreSuficiente && problemas.length === 0) { log_(`✓ Artigo aprovado na rodada ${rodada} (score ${ad.score_geral}/100)`, "ok"); break; }
        if (rodada === 3) { log_(`⚠ Score final ${ad.score_geral}/100 após 3 rodadas. Entregando melhor versão disponível.`, "warn"); break; }

        setFase(`revisao${rodada}`);
        log_(`Revisão ${rodada}/3 — corrigindo ${problemas.length} problema(s) para atingir score 90+...`, "warn");
        problemas.forEach(p => log_(`  → ${p}`, "warn"));
        await pausa(20, "", log_);
        const revisado = await callGroq(PROMPTS.revisar(textoFinal, problemas), 6000);
        if (revisado?.length > 500) {
          textoFinal = revisado; setArtigo(revisado);
          log_(`✓ Revisão ${rodada} aplicada — ${contarPalavras(revisado)} palavras`, "ok");
        } else {
          log_(`⚠ Revisão ${rodada} retornou texto muito curto, mantendo versão anterior.`, "warn");
        }

        if (rodada === 1) {
          setFase("fontes");
          log_("Verificando legislação e inserindo links para fontes oficiais...");
          await pausa(20, "", log_);
          try {
            const comLinks = await callGroqComSearch(PROMPTS.linkagem(textoFinal), 4500);
            if (comLinks?.length > 500) {
              textoFinal = comLinks; setArtigo(comLinks);
              const qtdLinks = (comLinks.match(/\[.+?\]\(https?:\/\/.+?\)/g) || []).length;
              log_(`✓ ${qtdLinks} link(s) externo(s) de fontes inserido(s)`, "ok");
            } else { log_("⚠ Etapa de fontes não alterou o texto — mantendo versão anterior.", "warn"); }
          } catch (e) { log_(`⚠ Etapa de fontes falhou (${e.message}). Continuando.`, "warn"); }

          setFase("links_internos");
          log_("Buscando artigos do blog Sittax para inserir links internos...");
          await pausa(20, "", log_);
          try {
            const comLinksInt = await callGroqComSearch(PROMPTS.linksInternos(textoFinal, tema), 4500);
            if (comLinksInt?.length > 500) {
              textoFinal = comLinksInt; setArtigo(comLinksInt);
              const qtdInt = (comLinksInt.match(/\[.+?\]\(https?:\/\/sittax\.com\.br\/blog\/.+?\)/g) || []).length;
              log_(`✓ ${qtdInt} link(s) interno(s) do blog Sittax inserido(s)`, "ok");
            } else { log_("⚠ Nenhum link interno inserido — mantendo versão anterior.", "warn"); }
          } catch (e) { log_(`⚠ Etapa de links internos falhou (${e.message}). Continuando.`, "warn"); }
        }
      }

      setAudit(auditFinal);
      setFase("pronto");

    } catch (err) {
      setErro(err.message || "Erro inesperado.");
      setFase("erro");
      log_(`✗ ${err.message}`, "erro");
    }
  }

  const busy = !["idle", "pronto", "erro"].includes(fase);
  const faseIdx = FASES.findIndex(f => f.id === fase);

  return (
    <div style={{ minHeight: "100vh", background: BRAND.bg, fontFamily: BRAND.font, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}>

      {/* ── Google Fonts: Inter ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
        input::placeholder { color: #BDBDBD; }
        input:focus { outline: none; border-color: ${BRAND.primary} !important; box-shadow: 0 0 0 3px ${BRAND.primaryLight}; }
        button:hover:not(:disabled) { opacity: 0.88; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ width: "100%", maxWidth: "760px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Logo Sittax SVG */}
          <svg style={{ height: "28px", width: "auto", flexShrink: 0 }} viewBox="0 0 3443.74 859.87" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs>
              <clipPath id="cp0"><rect x="0" y="0" width="3443.74" height="859.87" /></clipPath>
              <clipPath id="cp1"><rect x="0" y="0" width="3443.74" height="859.87" /></clipPath>
            </defs>
            <g clipPath="url(#cp0)">
              <g clipPath="url(#cp1)">
                <path fill="#3b3a3e" fillRule="evenodd" d="M1813.19,318.49c0-63.26-50.88-115.05-113.53-114.95l-266.02.46v56.78l235.52-.44c56.77-.12,83.87,28.29,83.87,85.57v35.75c-20.3-19.04-47.6-30.69-77.63-30.69h-128.24c-62.7,0-113.53,50.83-113.53,113.52v76.25c0,62.7,50.83,113.53,113.53,113.53h128.24c30.03,0,57.33-11.67,77.63-30.71v30.71h60.15v-335.77ZM1659.32,408.57c38.12,0,68.62,30.5,68.62,68.63v50.83c0,38.12-30.5,68.63-68.62,68.63h-96.06c-38.12,0-68.62-30.51-68.62-68.63v-50.83c0-38.13,30.5-68.63,68.62-68.63h96.06Z" />
                <path fill="#3b3a3e" fillRule="evenodd" d="M1367.74,596.66h-92.35c-49.98,0-80.48-38.13-80.48-86.55v-249.79h172.83v-56.76h-172.83v-89.64h-61v89.64h-71.17v56.76h71.17v280.29c0,62.83,50.83,113.67,113.53,113.67h120.3v-57.62Z" />
                <path fill="#3b3a3e" fillRule="evenodd" d="M996.84,596.66h-92.34c-49.99,0-80.49-38.13-80.49-86.55v-249.79h172.83v-56.76h-172.83v-89.64h-61v89.64h-71.17v56.76h71.17v280.29c0,62.84,50.84,113.67,113.53,113.67h120.3v-57.62Z" />
                <rect fill="#3b3a3e" x="564.94" y="203.55" width="61" height="450.72" />
                <path fill="#3b3a3e" fillRule="evenodd" d="M385.51,654.27c62.69.13,113.53-50.84,113.53-114.37v-27.12c-.86-61-49.99-110.13-110.15-110.13h-129.62c-50.84,0-77.1-20.47-77.1-62.27,0-5.93.12-14.41,0-20.47-.73-37.42,33.88-59.59,83.03-59.59h233.83v-56.76H238.09c-60.14,0-116.91,44.9-116.91,103.64v40.1c0,60.44,48.29,107.03,108.44,107.03h110.98c71.17,0,97.44,26.27,98.29,66.08v3.39c0,44.05-27.96,73-83.03,72.86L0,595.78v57.6l385.52.88Z" />
                <path fill="#3b3a3e" fillRule="evenodd" d="M2222.79,376.69l155.24-172.35h-94.27l-107.96,119.94,46.99,52.41ZM2128.62,480.92l-155.13,172.47h-94.38l202.33-224.53-202.33-224.52h94.38c134.78,149.8,269.77,299.37,404.65,449.05h-94.37l-155.15-172.47Z" />
                <path fill="#f26524" fillRule="evenodd" d="M3280,732.48c-156.82-119.51-375.57-119.51-532.4,0l127.38,127.38c84.68-52.86,192.94-52.86,277.62,0l127.39-127.38Z" />
                <path fill="#f26524" fillRule="evenodd" d="M2711.25,696.14c119.51-156.82,119.52-375.57.01-532.4l-127.39,127.39c52.86,84.68,52.87,192.95.01,277.64l127.37,127.37Z" />
                <path fill="#f26524" fillRule="evenodd" d="M2747.62,127.39c156.82,119.51,375.56,119.51,532.38-.01L3152.64,0c-84.68,52.87-192.94,52.86-277.62-.01l-127.39,127.39Z" />
                <path fill="#f26524" fillRule="evenodd" d="M3316.36,163.74c-119.51,156.82-119.52,375.57-.01,532.4l127.39-127.39c-52.86-84.68-52.87-192.95-.01-277.64l-127.37-127.37Z" />
              </g>
            </g>
          </svg>
          <div style={{ width: "1px", height: "28px", background: BRAND.border }} />
          <div>
            <div style={{ fontSize: "15px", fontWeight: "600", color: BRAND.text, letterSpacing: "-0.2px", lineHeight: 1.2 }}>Gerador de Artigos</div>
            <div style={{ fontSize: "11px", color: BRAND.textMuted, fontWeight: "400" }}>Inteligência Tributária</div>
          </div>
        </div>
        <div style={{ fontSize: "11px", color: BRAND.textLight, fontWeight: "500", background: "#F0F0F0", padding: "4px 10px", borderRadius: "20px" }}>
          Pesquisa · Corpo · FAQ · Auditoria · PDF
        </div>
      </div>

      {/* ── Card principal ── */}
      <div style={{ width: "100%", maxWidth: "760px", background: BRAND.card, borderRadius: BRAND.radiusLg, border: `1px solid ${BRAND.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.07)", overflow: "hidden" }}>

        {/* Input */}
        <div style={{ padding: "24px 28px", borderBottom: `1px solid ${BRAND.border}` }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: BRAND.textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Tema do artigo
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              value={tema}
              onChange={e => setTema(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !busy && gerar()}
              placeholder="Ex: Simples Nacional após a Reforma Tributária — o que muda para MEIs"
              disabled={busy}
              style={{
                flex: 1, padding: "11px 14px",
                borderRadius: BRAND.radius,
                border: `1.5px solid ${BRAND.border}`,
                fontSize: "14px", color: BRAND.text,
                background: busy ? "#F7F7F7" : "#fff",
                transition: "border-color 0.15s, box-shadow 0.15s",
                fontFamily: BRAND.font,
              }}
            />
            <button
              onClick={gerar}
              disabled={busy || !tema.trim()}
              style={{
                padding: "11px 22px",
                borderRadius: BRAND.radius,
                border: "none",
                background: busy || !tema.trim() ? "#E0E0E0" : BRAND.primary,
                color: busy || !tema.trim() ? "#ABABAB" : "#fff",
                fontSize: "14px", fontWeight: "600",
                cursor: busy || !tema.trim() ? "not-allowed" : "pointer",
                whiteSpace: "nowrap", fontFamily: BRAND.font,
                boxShadow: busy || !tema.trim() ? "none" : `0 2px 8px rgba(242,107,55,0.3)`,
                transition: "background 0.15s, box-shadow 0.15s",
              }}
            >
              {busy ? "Gerando…" : "Gerar artigo →"}
            </button>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: BRAND.textLight }}>
            Seja específico: mencione público-alvo, contexto ou dúvida dos seus clientes
          </p>
        </div>

        {/* Progress bar */}
        {!["idle", "erro"].includes(fase) && (
          <div style={{ padding: "16px 28px", borderBottom: `1px solid ${BRAND.border}`, background: "#FAFAFA" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {FASES.map((f, i) => {
                const done = fase === "pronto" || faseIdx > i;
                const active = faseIdx === i && fase !== "pronto";
                return (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", flex: i < FASES.length - 1 ? 1 : undefined }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <div style={{
                        width: "24px", height: "24px",
                        borderRadius: "50%",
                        background: done ? BRAND.primary : active ? BRAND.primaryLight : "#EBEBEB",
                        border: active ? `2px solid ${BRAND.primary}` : "2px solid transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "9px", fontWeight: "700",
                        color: done ? "#fff" : active ? BRAND.primary : "#ABABAB",
                        transition: "background 0.2s",
                      }}>
                        {done ? "✓" : active ? f.icon : i + 1}
                      </div>
                      <span style={{ fontSize: "8px", color: done || active ? BRAND.text : "#BDBDBD", whiteSpace: "nowrap", fontWeight: active ? "600" : "400" }}>
                        {f.label}
                      </span>
                    </div>
                    {i < FASES.length - 1 && (
                      <div style={{ flex: 1, height: "2px", margin: "0 2px", marginBottom: "16px", background: done ? BRAND.primary : "#E8E8E8", transition: "background 0.3s" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Log */}
        {log.length > 0 && (
          <div ref={logRef} style={{ padding: "14px 28px", borderBottom: fase === "pronto" || audit ? `1px solid ${BRAND.border}` : undefined, maxHeight: "180px", overflowY: "auto", background: "#FAFAFA" }}>
            {log.map((l, i) => (
              <div key={i} style={{
                fontSize: "12.5px", padding: "2px 0", display: "flex", gap: "10px",
                color: l.tipo === "ok" ? BRAND.success : l.tipo === "warn" ? BRAND.warn : l.tipo === "erro" ? BRAND.error : BRAND.textMuted
              }}>
                <span style={{ color: BRAND.textLight, fontFamily: "monospace", fontSize: "10.5px", flexShrink: 0 }}>{l.ts}</span>
                <span>{l.msg}</span>
              </div>
            ))}
            {busy && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", border: `2px solid ${BRAND.primary}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: "12.5px", color: BRAND.primary, fontWeight: "600" }}>
                  {FASES[faseIdx]?.icon} {FASES[faseIdx]?.label}…
                </span>
              </div>
            )}
          </div>
        )}

        {/* Auditoria final */}
        {audit && fase === "pronto" && (
          <div style={{ padding: "20px 28px", borderBottom: `1px solid ${BRAND.border}` }}>
            <div style={{ display: "flex", gap: "14px", marginBottom: "12px" }}>
              {/* Score */}
              <div style={{
                padding: "14px 20px", borderRadius: BRAND.radiusMd, textAlign: "center",
                background: audit.score_geral >= 90 ? BRAND.successBg : audit.score_geral >= 80 ? BRAND.warnBg : BRAND.errorBg,
                border: `1px solid ${audit.score_geral >= 90 ? BRAND.successBorder : audit.score_geral >= 80 ? BRAND.warnBorder : BRAND.errorBorder}`,
                minWidth: "80px",
              }}>
                <div style={{ fontSize: "30px", fontWeight: "800", lineHeight: 1, color: audit.score_geral >= 90 ? BRAND.success : audit.score_geral >= 80 ? BRAND.warn : BRAND.error }}>
                  {audit.score_geral}
                </div>
                <div style={{ fontSize: "9px", color: BRAND.textMuted, fontWeight: "700", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Score</div>
              </div>
              {/* Checklist */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px", marginBottom: "10px" }}>
                  {Object.entries(audit.checklist || {}).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px" }}>
                      <span style={{ color: v ? "#22C55E" : "#EF4444", fontWeight: "700" }}>{v ? "✓" : "✗"}</span>
                      <span style={{ color: v ? BRAND.text : BRAND.textLight }}>{k.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
                <div style={{
                  display: "inline-block", padding: "3px 10px",
                  borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                  background: audit.aprovado ? BRAND.successBg : BRAND.errorBg,
                  color: audit.aprovado ? BRAND.success : BRAND.error,
                  border: `1px solid ${audit.aprovado ? BRAND.successBorder : BRAND.errorBorder}`,
                }}>
                  {audit.aprovado ? "✓ Aprovado" : "⚠ Melhorias aplicadas"}
                </div>
              </div>
            </div>

            {/* Yoast */}
            {audit.yoast && (
              <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                <div style={{
                  flex: 1, padding: "10px 14px", borderRadius: BRAND.radiusMd, border: `1px solid ${BRAND.border}`,
                  background: audit.yoast.status_transicao === "verde" ? BRAND.successBg : audit.yoast.status_transicao === "laranja" ? BRAND.warnBg : BRAND.errorBg
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: audit.yoast.status_transicao === "verde" ? "#22C55E" : audit.yoast.status_transicao === "laranja" ? "#F59E0B" : "#EF4444"
                    }} />
                    <span style={{ fontSize: "11px", fontWeight: "700", color: BRAND.text }}>Palavras de transição</span>
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: BRAND.text }}>{audit.yoast.percentual_transicao}%</div>
                  <div style={{ fontSize: "10px", color: BRAND.textMuted }}>meta: ≥ 30% · {audit.yoast.frases_com_transicao}/{audit.yoast.total_frases} frases</div>
                </div>
                <div style={{
                  flex: 1, padding: "10px 14px", borderRadius: BRAND.radiusMd, border: `1px solid ${BRAND.border}`,
                  background: audit.yoast.status_passiva === "verde" ? BRAND.successBg : BRAND.errorBg
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: audit.yoast.status_passiva === "verde" ? "#22C55E" : "#EF4444"
                    }} />
                    <span style={{ fontSize: "11px", fontWeight: "700", color: BRAND.text }}>Voz passiva</span>
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: BRAND.text }}>{audit.yoast.percentual_passiva}%</div>
                  <div style={{ fontSize: "10px", color: BRAND.textMuted }}>meta: ≤ 10% · {audit.yoast.frases_passivas}/{audit.yoast.total_frases} frases</div>
                </div>
              </div>
            )}

            {audit.resumo && (
              <p style={{ margin: 0, fontSize: "13px", color: BRAND.text, background: "#F7F7F7", borderRadius: BRAND.radius, padding: "12px 16px", borderLeft: `3px solid ${BRAND.primary}` }}>
                {audit.resumo}
              </p>
            )}
          </div>
        )}

        {/* Metadados */}
        {pesquisa && fase === "pronto" && (
          <div style={{ padding: "16px 28px", borderBottom: `1px solid ${BRAND.border}` }}>
            <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: "700", color: BRAND.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Metadados para o WordPress
            </p>
            {[["Keyword primária", pesquisa.keyword_primaria], ["Meta Title", pesquisa.meta_title], ["Meta Description", pesquisa.meta_description], ["Slug", pesquisa.slug]].map(([l, v]) => v ? (
              <div key={l} style={{ marginBottom: "5px", fontSize: "13px" }}>
                <span style={{ color: BRAND.textLight }}>{l}: </span>
                <span style={{ color: BRAND.text, fontWeight: "500" }}>{v}</span>
              </div>
            ) : null)}
          </div>
        )}

        {/* Botões de ação */}
        {fase === "pronto" && artigo && (
          <>
            <div style={{ padding: "20px 28px 14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => baixarHtml(artigo, pesquisa)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "12px 24px", borderRadius: BRAND.radius, border: "none",
                  background: BRAND.primary, color: "#fff",
                  fontSize: "14px", fontWeight: "600", cursor: "pointer",
                  boxShadow: `0 2px 10px rgba(242,107,55,0.35)`,
                  fontFamily: BRAND.font,
                }}
              >
                ⬇ Baixar arquivo para PDF
              </button>
              <button
                onClick={() => { setFase("idle"); setTema(""); setLog([]); setPesquisa(null); setArtigo(""); setAudit(null); }}
                style={{
                  padding: "12px 20px", borderRadius: BRAND.radius,
                  border: `1.5px solid ${BRAND.border}`,
                  background: "#fff", color: BRAND.text,
                  fontSize: "14px", cursor: "pointer", fontFamily: BRAND.font, fontWeight: "500",
                }}
              >
                Novo artigo
              </button>
            </div>
            <div style={{ margin: "0 28px 20px", padding: "11px 14px", background: BRAND.warnBg, border: `1px solid ${BRAND.warnBorder}`, borderRadius: BRAND.radius, fontSize: "12px", color: BRAND.warn, lineHeight: "1.7" }}>
              <strong>Como converter para PDF:</strong> baixe o arquivo → abra no navegador → <strong>Ctrl+P</strong> → destino <strong>"Salvar como PDF"</strong> → Salvar.
            </div>
          </>
        )}

        {/* Erro */}
        {fase === "erro" && (
          <div style={{ padding: "18px 28px", background: BRAND.errorBg, borderTop: `1px solid ${BRAND.errorBorder}` }}>
            <p style={{ margin: "0 0 12px", color: BRAND.error, fontSize: "13px" }}>⚠ {erro}</p>
            <button
              onClick={() => { setFase("idle"); setLog([]); }}
              style={{ padding: "8px 16px", borderRadius: BRAND.radius, border: `1px solid ${BRAND.errorBorder}`, background: "#fff", color: BRAND.error, fontSize: "13px", cursor: "pointer", fontFamily: BRAND.font }}
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>

      {/* Dica inferior */}
      {fase === "idle" && (
        <div style={{ marginTop: "14px", maxWidth: "760px", width: "100%", padding: "13px 18px", borderRadius: BRAND.radius, background: BRAND.primaryLight, border: `1px solid ${BRAND.primaryBorder}`, fontSize: "13px", color: BRAND.primaryDark, lineHeight: "1.65" }}>
          <strong>Como usar:</strong> Digite o tema e clique em "Gerar artigo". O processo leva ~5 minutos — inclui polimento Yoast (transição + voz ativa) e <strong>3 rodadas de auditoria/revisão</strong> para score ≥ 90. Depois baixe e converta para PDF com Ctrl+P.
        </div>
      )}

      {/* Assinatura */}
      <div style={{ width: "100%", maxWidth: "760px", marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "11px", color: BRAND.textLight, fontWeight: "400", letterSpacing: "0.01em" }}>
          Powered by{" "}
          <span style={{ fontWeight: "600", color: BRAND.textMuted }}>Victor Lisita MKT</span>
        </span>
      </div>

    </div>
  );
}
