/* Interface (port de main.py) */

if (typeof document !== 'undefined') (function () {
    const $ = id => document.getElementById(id);
    const input = $('input'), statusEl = $('status');
    let lastResult = null, undoStack = [];
  
    // Sélecteurs
    $('mode').innerHTML  = Object.entries(HUMAN_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    $('style').innerHTML = Object.entries(STYLE_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  
    // Barres de dimensions
    const DIM_NAMES = ["Perplexité lex.","Uniformité phrases","Marqueurs IA","Richesse ponctuation",
                       "Diversité lexicale","Structures IA","Burstiness","Ton assertif/prudent"];
    $('dims').innerHTML = DIM_NAMES.map((n, i) =>
      `<div class="dim"><span class="name">${n}</span><div class="bar"><i id="bar${i}"></i></div><span class="pct" id="pct${i}">—</span></div>`).join('');
  
    const scoreColor = s => s < 20 ? 'var(--green)' : s < 40 ? 'var(--lime)' : s < 55 ? 'var(--orange)' : s < 70 ? 'var(--deep-orange)' : 'var(--red)';
    const CIRC = 2 * Math.PI * 80;
  
    function setStatus(msg, kind = '') { statusEl.textContent = msg; statusEl.className = 'status ' + kind; }
    function updateCounter() {
      const n = (input.value.trim().match(/\S+/g) || []).length;
      $('counter').textContent = n + (n > 1 ? ' mots' : ' mot');
    }
    input.addEventListener('input', updateCounter);
  
    function tweenNumber(el, to, ms = 800) {
      const from = parseFloat(el.textContent) || 0, t0 = performance.now();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = Math.round(to); return; }
      (function f(t) {
        const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(from + (to - from) * e);
        if (k < 1) requestAnimationFrame(f);
      })(t0);
    }
    function setGauge(score, label) {
      const color = score == null ? 'var(--muted)' : scoreColor(score);
      const arc = $('arc');
      arc.style.stroke = color;
      arc.style.strokeDashoffset = CIRC * (1 - (score || 0) / 100);
      $('g-num').style.color = color;
      tweenNumber($('g-num'), score || 0);
      $('g-label').textContent = label;
      $('g-label').style.color = score == null ? 'var(--muted)' : color;
    }
  
    function showResult(r) {
      lastResult = r;
      const color = scoreColor(r.score);
      setGauge(r.score, r.verdict);
      $('m-verdict').textContent = r.verdict; $('m-verdict').style.color = color;
      $('m-tokens').textContent = r.token_count;
      const cc = { 'faible': 'var(--red)', 'modérée': 'var(--orange)', 'élevée': 'var(--green)' }[r.confidence];
      $('m-conf').textContent = cap(r.confidence); $('m-conf').style.color = cc;
      r.dimensions.forEach(d => {
        const i = DIM_NAMES.indexOf(d.name); if (i < 0) return;
        const c = scoreColor(d.score * 100);
        $('bar' + i).style.width = (d.score * 100) + '%'; $('bar' + i).style.background = c;
        $('pct' + i).textContent = Math.round(d.score * 100) + '%'; $('pct' + i).style.color = c;
      });
      const w = $('warn');
      if (r.warnings.length) { w.hidden = false; w.innerHTML = r.warnings.map(x => `<p>⚠ ${x.replace(/</g, '&lt;')}</p>`).join(''); }
      else w.hidden = true;
      $('btn-export').disabled = false;
      if (!$('json-card').hidden) $('json').textContent = JSON.stringify(resultToDict(r), null, 2);
      setStatus('Analyse terminée.', 'ok');
    }
  
    function requireText(action) {
      const t = input.value.trim();
      if (!t) { setStatus(`Aucun texte à ${action}.`, 'err'); return null; }
      return t;
    }
    function busy(on, label) {
      ['btn-analyze', 'btn-humanize', 'btn-refile'].forEach(id => $(id).disabled = on);
      if (on) setStatus(label);
    }
    function run(label, fn) {
      busy(true, label);
      setTimeout(() => {
        try { fn(); } catch (e) { setStatus('Erreur : ' + e.message, 'err'); }
        busy(false);
      }, 30);
    }
    function replaceText(newText, msg) {
      undoStack.push(input.value); $('btn-undo').disabled = false;
      input.value = newText; updateCounter(); setStatus(msg, 'ok');
    }
  
    $('btn-analyze').onclick = () => {
      const t = requireText('analyser'); if (t == null) return;
      setGauge(0, 'Analyse…');
      run('Analyse en cours…', () => showResult(analyzeText(t)));
    };
    $('btn-humanize').onclick = () => {
      const t = requireText('humaniser'); if (t == null) return;
      run('Humanisation en cours…', () => replaceText(humanizeText(t, $('mode').value), 'Texte humanisé.'));
    };
    $('btn-refile').onclick = () => {
      const t = requireText('reformater'); if (t == null) return;
      run('Reformatage en cours…', () => replaceText(REFORMAT[$('style').value](t), 'Texte reformaté.'));
    };
    $('btn-undo').onclick = () => {
      if (!undoStack.length) return;
      input.value = undoStack.pop(); updateCounter();
      $('btn-undo').disabled = !undoStack.length; setStatus('Modification annulée.');
    };
  
    async function copy(text, okMsg, fallbackEl) {
      try { await navigator.clipboard.writeText(text); setStatus(okMsg, 'ok'); }
      catch (_) {
        const el = fallbackEl; el.focus(); el.select && el.select();
        if (!el.select) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
        setStatus('Copie automatique bloquée : le texte est sélectionné, faites Ctrl+C.', 'err');
      }
    }
    $('btn-copy').onclick = () => { if (input.value.trim()) copy(input.value, 'Texte copié.', input); };
    $('btn-export').onclick = () => {
      if (!lastResult) return;
      $('json').textContent = JSON.stringify(resultToDict(lastResult), null, 2);
      $('json-card').hidden = false;
      $('json-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    $('btn-copy-json').onclick = () => copy($('json').textContent, 'JSON copié.', $('json'));
  
    $('btn-reset').onclick = () => {
      input.value = ''; undoStack = []; lastResult = null; updateCounter();
      setGauge(null, 'En attente…');
      ['m-verdict', 'm-tokens', 'm-conf'].forEach(id => { $(id).textContent = '—'; $(id).style.color = ''; });
      DIM_NAMES.forEach((_, i) => { $('bar' + i).style.width = '0'; $('pct' + i).textContent = '—'; $('pct' + i).style.color = ''; });
      $('warn').hidden = true; $('json-card').hidden = true;
      $('btn-export').disabled = true; $('btn-undo').disabled = true;
      setStatus('');
    };
  
    // Import de fichier
    $('btn-import').onclick = () => $('file').click();
    $('file').onchange = async e => {
      const f = e.target.files[0]; e.target.value = '';
      if (!f) return;
      const ext = f.name.split('.').pop().toLowerCase();
      try {
        let text;
        if (ext === 'txt' || ext === 'md') text = await f.text();
        else if (ext === 'docx') {
          if (!window.mammoth) throw new Error("lecteur .docx indisponible (bibliothèque non chargée)");
          text = (await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value;
        } else throw new Error("format non supporté (.txt, .md ou .docx). Pour un PDF, copiez-collez le texte.");
        undoStack.push(input.value); $('btn-undo').disabled = false;
        input.value = text; updateCounter(); setStatus(`Fichier chargé : ${f.name}`, 'ok');
      } catch (err) { setStatus('Erreur : ' + err.message, 'err'); }
    };
  
    updateCounter();
  })();