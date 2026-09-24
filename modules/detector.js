/* Détecteur (port de detecteur.py) */

const AI_MARKER_LIST = [
    "tout d'abord","premièrement","deuxièmement","troisièmement","en premier lieu",
    "en second lieu","en conclusion","pour conclure","en résumé","en somme",
    "il convient de","il est important de","il est essentiel de",
    "dans ce contexte","à cet égard","à titre d'exemple",
    "firstly","secondly","thirdly","furthermore","moreover","additionally",
    "in conclusion","to summarize","it is worth noting","it is important to",
    "in this context","in this regard"];
  const SMOOTH_LIST = [
    "de plus","par ailleurs","en outre","cependant","néanmoins","toutefois",
    "en revanche","d'une part","d'autre part","quoi qu'il en soit",
    "furthermore","however","nevertheless","nonetheless","on the other hand",
    "in addition","that being said","with that said"];
  const FILLER_LIST = [
    "très","vraiment","absolument","totalement","complètement","entièrement",
    "particulièrement","notamment","spécifiquement","very","really","absolutely",
    "totally","completely","entirely","particularly","specifically","essentially","basically"];
  const OVERCONF_LIST = [
    "toujours","jamais","absolument","sans aucun doute","il est certain",
    "always","never","absolutely","without doubt","it is certain","undeniably",
    "unquestionably","definitively"];
  const HEDGE_LIST = [
    "peut-être","il semblerait","on pourrait dire","dans une certaine mesure",
    "perhaps","it seems","one could argue","to some extent","arguably",
    "it is worth considering","it may be"];
  
  const AI_MARKER_RE = WL(AI_MARKER_LIST);
  const SMOOTH_RE    = WL(SMOOTH_LIST);
  const FILLER_RE    = WL(FILLER_LIST);
  const OVERCONF_RE  = WL(OVERCONF_LIST);
  const HEDGE_RE     = WL(HEDGE_LIST);
  const HUMAN_PUNCT  = /[—–…]|\.{3}|!{2,}|\?{2,}/g;
  
  function tokenize(text) {
    return (text.toLowerCase().match(/[\p{L}'’\-]+/gu) || []).filter(t => /\p{L}/u.test(t));
  }
  function detSentences(text) {
    return text.trim().split(/(?<=[.!?])\s+/).filter(p => p.length > 10);
  }
  
  // Chaque dimension renvoie une "probabilité IA" dans [0, 1].
  function dimPerplexity(tokens) {
    const name = "Perplexité lex.", w = 0.20;
    if (!tokens.length) return { name, score: 0.5, weight: w, details: {} };
    const counts = new Map();
    tokens.forEach(t => counts.set(t, (counts.get(t) || 0) + 1));
    const total = tokens.length;
    let entropy = 0;
    counts.forEach(c => { const p = c / total; entropy -= p * Math.log2(p); });
    const norm = total > 1 ? entropy / Math.log2(total) : 1;   // 0..1, indépendant de la longueur
    const score = clamp(sigmoid(norm, 0.86, -14));              // entropie élevée -> humain
    return { name, score, weight: w,
      details: { entropy_bits: +entropy.toFixed(3), normalized: +norm.toFixed(3), unique_tokens: counts.size, total } };
  }
  function dimUniformity(sents) {
    const name = "Uniformité phrases", w = 0.15;
    if (sents.length < 4) return { name, score: 0.5, weight: w, details: {} };
    const lens = sents.map(s => s.split(/\s+/).length);
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const std = Math.sqrt(lens.reduce((a, l) => a + (l - mean) ** 2, 0) / lens.length);
    const cv = mean > 0 ? std / mean : 0;
    return { name, score: clamp(sigmoid(cv, 0.45, -8)), weight: w,
      details: { cv: +cv.toFixed(4), mean_len: +mean.toFixed(1), std_len: +std.toFixed(1) } };
  }
  function dimMarkers(text, tokens) {
    const name = "Marqueurs IA", w = 0.20;
    if (!tokens.length) return { name, score: 0.5, weight: w, details: {} };
    const m = count(AI_MARKER_RE, text), c = count(SMOOTH_RE, text), f = count(FILLER_RE, text);
    const density = (m + c * 0.5 + f * 0.3) / (tokens.length / 100);
    return { name, score: clamp(sigmoid(density, 1.5, 0.9)), weight: w,
      details: { ai_phrases: m, smooth_connectors: c, filler_words: f, density_per_100tok: +density.toFixed(2) } };
  }
  function dimPunctuation(text, sents) {
    const name = "Richesse ponctuation", w = 0.10;
    if (!sents.length) return { name, score: 0.5, weight: w, details: {} };
    const marks = count(HUMAN_PUNCT, text);
    const density = marks / (text.length / 1000 || 1);
    return { name, score: clamp(sigmoid(density, 2, -0.8)), weight: w,
      details: { human_punct_count: marks, density_per_1000ch: +density.toFixed(2) } };
  }
  function dimLexDiversity(tokens) {
    const name = "Diversité lexicale", w = 0.10;
    if (tokens.length < 20) return { name, score: 0.5, weight: w, details: {} };
    const types = new Set(tokens).size;
    const cttr = types / Math.sqrt(2 * tokens.length);
    return { name, score: clamp(sigmoid(cttr, 5, -0.8)), weight: w,
      details: { cttr: +cttr.toFixed(4), types, tokens: tokens.length } };
  }
  function dimStructure(text) {
    const name = "Structures IA", w = 0.10;
    const bullets = count(/^\s*[-•*]\s+.{20,}/gm, text);
    const headers = count(/^#{1,4}\s+\S/gm, text);
    const numbered = count(/^\s*\d+[.)]\s+.{20,}/gm, text);
    const totalLines = Math.max(text.split(/\r?\n/).length, 1);
    const density = (bullets + headers * 2 + numbered) / Math.max(totalLines, 5);
    return { name, score: clamp(sigmoid(density, 0.3, 6)), weight: w,
      details: { bullet_lines: bullets, markdown_headers: headers, numbered_lists: numbered } };
  }
  function dimBurstiness(sents) {
    const name = "Burstiness", w = 0.10;
    if (sents.length < 6) return { name, score: 0.5, weight: w, details: {} };
    const lens = sents.map(s => s.split(/\s+/).length).sort((a, b) => a - b);
    const n = lens.length, sum = lens.reduce((a, b) => a + b, 0);
    let g = 0; lens.forEach((l, i) => { g += (2 * (i + 1) - n - 1) * l; });
    const gini = g / (n * (sum || 1));
    return { name, score: clamp(sigmoid(gini, 0.25, -12)), weight: w,
      details: { gini: +gini.toFixed(4), n_sentences: n } };
  }
  function dimTone(text, tokens) {
    const name = "Ton assertif/prudent", w = 0.05;
    if (!tokens.length) return { name, score: 0.5, weight: w, details: {} };
    const o = count(OVERCONF_RE, text), h = count(HEDGE_RE, text);
    const density = (o + h) / (tokens.length / 100);
    return { name, score: clamp(sigmoid(density, 2, 0.8)), weight: w,
      details: { overconfident_count: o, hedging_count: h, density_per_100tok: +density.toFixed(2) } };
  }
  
  const MIN_TOKENS = 50;
  function analyzeText(text) {
    const warnings = [];
    const tokens = tokenize(text), sents = detSentences(text);
    if (tokens.length < MIN_TOKENS) warnings.push(`Texte court (${tokens.length} tokens) : résultat peu fiable`);
  
    const dimensions = [
      dimPerplexity(tokens), dimUniformity(sents), dimMarkers(text, tokens),
      dimPunctuation(text, sents), dimLexDiversity(tokens), dimStructure(text),
      dimBurstiness(sents), dimTone(text, tokens),
    ];
    const totalW = dimensions.reduce((a, d) => a + d.weight, 0);
    const raw = dimensions.reduce((a, d) => a + d.score * d.weight, 0) / totalW;
    const score = Math.round(clamp(raw) * 1000) / 10;
  
    const verdict = score < 25 ? "Très probablement humain"
                  : score < 45 ? "Probablement humain"
                  : score < 60 ? "Incertain (mélangé)"
                  : score < 80 ? "Probablement IA"
                  : "Très probablement IA";
    const confidence = tokens.length < MIN_TOKENS * 0.5 ? "faible"
                     : tokens.length < 300 ? "modérée" : "élevée";
    return { score, verdict, confidence, dimensions, token_count: tokens.length, warnings };
  }
  function resultToDict(r) {
    return {
      score: +r.score.toFixed(2), verdict: r.verdict, confidence: r.confidence,
      token_count: r.token_count, warnings: r.warnings,
      dimensions: r.dimensions.map(d => ({
        name: d.name, score: +d.score.toFixed(4), weight: d.weight,
        weighted_contribution: +(d.score * d.weight).toFixed(4), details: d.details })),
    };
  }