/* Reformatage (port de refile.py) */

const STYLE_LABELS = {
    pave: "Pavé (bloc unique)", paragraphes: "Paragraphes aérés", liste: "Liste à puces",
    numerotee: "Liste numérotée", titres: "Titres + sections", dialogue: "Dialogue / script",
    cartes: "Cartes séparées", compact: "Compact (une ligne)",
  };
  const SENT_END = /(?<=[.!?…])\s+(?=[A-ZÀ-Ý0-9«"'(])/;
  const STOP_TITLE = new Set(["le","la","les","un","une","des","de","du","et","ou","que","qui","à","au","aux","en","dans","sur"]);
  
  function rfNormalize(t) {
    t = t.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ');
    t = t.split('\n').map(l => l.trim()).join('\n').replace(/\n{2,}/g, '\n\n');
    return t.trim();
  }
  function rfStripMarkup(text) {
    const lines = [];
    for (let l of text.split('\n')) {
      l = l.trim(); if (!l) continue;
      l = l.replace(/^[•\-*–—]\s+/, '').replace(/^\d+[.)\-]\s+/, '').replace(/^#{1,6}\s+/, '');
      lines.push(l);
    }
    return lines.join(' ');
  }
  function rfSentences(text) {
    const flat = rfStripMarkup(rfNormalize(text)).replace(/[ \t]+/g, ' ').trim();
    return flat ? flat.split(SENT_END).map(s => s.trim()).filter(Boolean) : [];
  }
  function chunk(a, n) { n = Math.max(1, n); const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; }
  function guessTitle(s, max = 6) {
    let w = s.match(/[\wÀ-ÿ\-']+/g) || [];
    const f = w.filter(x => !STOP_TITLE.has(x.toLowerCase()));
    if (f.length) w = f;
    const t = w.slice(0, max).join(' ').replace(/^[ ,;:.]+|[ ,;:.]+$/g, '');
    return t ? t[0].toUpperCase() + t.slice(1).toLowerCase() : "Point clé";
  }
  function wrapText(text, width) {
    const lines = []; let cur = '';
    for (const w of text.split(/\s+/)) {
      if (cur && (cur + ' ' + w).length > width) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    }
    if (cur) lines.push(cur);
    return lines.join('\n');
  }
  const REFORMAT = {
    pave: t => { const s = rfSentences(t); return s.length ? s.join(' ') : rfNormalize(t); },
    paragraphes: t => { const s = rfSentences(t); return s.length ? chunk(s, 3).map(g => g.join(' ')).join('\n\n') : rfNormalize(t); },
    liste: t => { const s = rfSentences(t); return s.length ? s.map(x => '• ' + x).join('\n') : rfNormalize(t); },
    numerotee: t => { const s = rfSentences(t); return s.length ? s.map((x, i) => `${i + 1}. ${x}`).join('\n') : rfNormalize(t); },
    titres: t => { const s = rfSentences(t); return s.length ? chunk(s, 2).map(g => `## ${guessTitle(g[0])}\n${g.join(' ')}`).join('\n\n') : rfNormalize(t); },
    dialogue: t => { const s = rfSentences(t); return s.length ? s.map((x, i) => `${i % 2 ? 'B' : 'A'} : ${x}`).join('\n') : rfNormalize(t); },
    cartes: t => {
      const s = rfSentences(t); if (!s.length) return rfNormalize(t);
      const sep = '─'.repeat(32);
      return chunk(s, 2).map((g, i) => `${sep}\n[${i + 1}] ${guessTitle(g[0])}\n${sep}\n${wrapText(g.join(' '), 60)}`).join('\n\n');
    },
    compact: t => { const s = rfSentences(t); return (s.length ? s.join(' ') : t.replace(/\n/g, ' ')).replace(/[ \t]+/g, ' ').trim(); },
  };