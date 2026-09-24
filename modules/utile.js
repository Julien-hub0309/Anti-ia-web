/* Utilitaires partagés */

const pick    = a => a[Math.floor(Math.random() * a.length)];
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const cap     = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const clamp   = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const sigmoid = (x, center, steep) => 1 / (1 + Math.exp(-steep * (x - center)));

// \b de JS ne gère pas les lettres accentuées : on utilise des lookarounds Unicode.
const WB_L = '(?<![\\p{L}\\p{N}_])';
const WB_R = '(?![\\p{L}\\p{N}_])';
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const apos  = s => escRe(s).replace(/'/g, "['’]");
// Liste de mots/expressions littéraux -> regex
const WL = list => new RegExp(`${WB_L}(?:${list.map(apos).join('|')})${WB_R}`, 'giu');
// Source de regex brute (ex. "éléments?") -> regex
const WR = src  => new RegExp(`${WB_L}(?:${src})${WB_R}`, 'giu');
const count = (re, t) => (t.match(re) || []).length;

// Remplace en conservant la majuscule initiale
function sub(text, re, choices) {
  return text.replace(re, m => {
    const r = pick(choices);
    return /^\p{Lu}/u.test(m) ? cap(r) : r;
  });
}