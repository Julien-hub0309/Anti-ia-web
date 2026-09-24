/* Humaniseur (port de anti_detecteur.py, partie texte) */

const MARKER_REPL = [
    ["tout d'abord", ["d'abord","pour commencer","en premier"]],
    ["premièrement", ["d'abord","avant tout"]],
    ["deuxièmement", ["ensuite","puis"]],
    ["troisièmement", ["enfin","pour finir"]],
    ["en premier lieu", ["d'abord","avant tout"]],
    ["en second lieu", ["ensuite","après ça"]],
    ["en conclusion", ["bref","au final","voilà"]],
    ["pour conclure", ["bref","en fin de compte"]],
    ["en résumé", ["bref","en gros"]],
    ["en somme", ["bref","au total"]],
    ["il convient de", ["il faut","on doit","mieux vaut"]],
    ["il est important de", ["il faut","pensez à","n'oublions pas de"]],
    ["il est essentiel de", ["il faut absolument","on ne peut pas éviter de"]],
    ["dans ce contexte", ["ici","dans cette situation","face à ça"]],
    ["à cet égard", ["là-dessus","sur ce point"]],
    ["à titre d'exemple", ["par exemple","prenons le cas de","comme"]],
    ["de plus", ["et","aussi","en plus"]],
    ["par ailleurs", ["d'un autre côté","autrement"]],
    ["en outre", ["et","aussi","en plus"]],
    ["cependant", ["mais","sauf que","pourtant"]],
    ["néanmoins", ["quand même","malgré ça","mais"]],
    ["toutefois", ["sauf que","mais bon","quand même"]],
    ["en revanche", ["à l'inverse","de l'autre côté","mais"]],
    ["d'une part", ["d'un côté"]],
    ["d'autre part", ["de l'autre"]],
    ["quoi qu'il en soit", ["de toute façon","peu importe"]],
    ["très", ["assez","plutôt","bien"]],
    ["vraiment", ["assez","bien","franchement"]],
    ["absolument", ["tout à fait","complètement","oui"]],
    ["totalement", ["entièrement","à fond","vraiment"]],
    ["complètement", ["tout à fait","à fond"]],
    ["entièrement", ["en totalité","à fond"]],
    ["particulièrement", ["surtout","en particulier"]],
    ["notamment", ["surtout","par exemple","entre autres"]],
    ["spécifiquement", ["en particulier","surtout","précisément"]],
  ].map(([p, c]) => [WL([p]), c]);
  
  const OVERCONF_REPL = [
    ["toujours", ["souvent","en règle générale","généralement"]],
    ["jamais", ["rarement","quasiment jamais","très peu"]],
    ["sans aucun doute", ["assez clairement","de façon assez évidente"]],
    ["il est certain", ["il semble","on peut penser","il paraît"]],
    ["peut-être", ["probablement","sans doute"]],
    ["il semblerait", ["il semble","on constate que"]],
    ["on pourrait dire", ["on dit","on considère"]],
    ["dans une certaine mesure", ["en partie","assez largement"]],
  ].map(([p, c]) => [WL([p]), c]);
  
  const VOCAB = [
    ["utiliser", ["employer","recourir à","se servir de","mobiliser"]],
    ["faire", ["réaliser","effectuer","mener","accomplir"]],
    ["voir", ["observer","constater","remarquer","percevoir"]],
    ["dire", ["affirmer","souligner","indiquer","préciser"]],
    ["donner", ["fournir","apporter","offrir","procurer"]],
    ["prendre", ["adopter","saisir","choisir","retenir"]],
    ["mettre", ["placer","poser","insérer","disposer"]],
    ["penser", ["considérer","estimer","juger","croire"]],
    ["savoir", ["comprendre","maîtriser","connaître","percevoir"]],
    ["vouloir", ["souhaiter","désirer","chercher à","aspirer à"]],
    ["pouvoir", ["être en mesure de","avoir la possibilité de","réussir à"]],
    ["devenir", ["se transformer en","évoluer vers","se muer en"]],
    ["important", ["significatif","notable","non négligeable","conséquent"]],
    ["problème", ["difficulté","défi","point délicat","écueil"]],
    ["solution", ["réponse","issue","moyen","piste"]],
    ["système", ["mécanisme","dispositif","ensemble","structure"]],
    ["processus", ["démarche","procédé","cheminement","enchaînement"]],
    ["résultat", ["effet","conséquence","aboutissement","issue"]],
    ["aspect", ["dimension","facette","angle","volet"]],
    ["domaine", ["secteur","champ","territoire","sphère"]],
    ["niveau", ["degré","plan","palier","échelon"]],
    ["approche", ["méthode","façon de faire","angle d'attaque","stratégie"]],
    ["cadre", ["contexte","environnement","périmètre","structure"]],
    ["perspective", ["angle","point de vue","vision","horizon"]],
    ["analyse", ["étude","examen","décryptage","lecture"]],
    ["éléments?", ["points","aspects","facteurs","composantes"]],
    ["beaucoup", ["énormément","bien des","nombre de","une foule de"]],
    ["peu", ["guère","à peine","pas beaucoup de"]],
    ["rapidement", ["vite","sans tarder","promptement","en peu de temps"]],
    ["difficile", ["ardu","délicat","complexe","pas simple"]],
    ["simple", ["aisé","accessible","direct","sans détour"]],
  ].map(([p, c]) => [WR(p), c]);
  
  const SHORTS = ["C'est clair.","Pas anodin.","Ça compte.","Simple, non ?","Et c'est tout.",
    "Voilà l'idée.","On y reviendra.","À noter.","Pas si simple.","C'est là le nœud.","Ça mérite réflexion."];
  const ULTRA_SHORT = ["Voilà.","C'est dit.","Pas moins.","Ça, c'est sûr.","Simple.","Net.","Difficile à nier.","Parlant."];
  
  const hSplit = t => t.split(/(?<=[.!?…])\s+/).map(s => s.trim()).filter(Boolean);
  
  function removeAiStructure(text) {
    const out = [];
    for (let line of text.split(/\r?\n/)) {
      line = line.replace(/^#{1,6}\s+/, '')
                 .replace(/^\s*[-•*]\s+/, '')
                 .replace(/^\s*\d+[.)]\s+/, '')
                 .replace(/\*\*(.*?)\*\*/g, '$1')
                 .replace(/\*(.*?)\*/g, '$1');
      if (line.trim()) out.push(line.trim());
    }
    return out.join(' ').replace(/ {2,}/g, ' ').trim();
  }
  function removeAiMarkers(text) {
    for (const [re, ch] of MARKER_REPL) text = sub(text, re, ch);
    return text;
  }
  function reduceTone(text) {
    for (const [re, ch] of OVERCONF_REPL) text = sub(text, re, ch);
    return text;
  }
  function enrichVocabulary(text, rate) {
    for (const [re, ch] of VOCAB) {
      text = text.replace(re, m => {
        if (Math.random() > rate) return m;
        const r = pick(ch);
        return /^\p{Lu}/u.test(m) ? cap(r) : r;
      });
    }
    return text;
  }
  function maximizeBurstiness(sents) {
    const result = []; let i = 0, every = randInt(3, 5);
    while (i < sents.length) {
      const s = sents[i], words = s.split(/\s+/), n = words.length;
      if (n > 20 && Math.random() < 0.75) {
        const mid = Math.floor(n / 2); let cut = mid;
        for (let k = Math.max(1, mid - 4); k < Math.min(n - 1, mid + 5); k++) {
          if (words[k].endsWith(',')) { cut = k + 1; break; }
        }
        const p1 = words.slice(0, cut).join(' ').replace(/,$/, '') + '.';
        let p2 = words.slice(cut).join(' ');
        if (p2 && /^\p{Ll}/u.test(p2)) p2 = cap(p2);
        result.push(p1); if (p2.trim()) result.push(p2);
        i++; continue;
      }
      if (n < 5 && i + 1 < sents.length && sents[i + 1].split(/\s+/).length < 5) {
        const nx = sents[i + 1];
        result.push(s.replace(/[.!?]+$/, '') + pick([', et ', ' — et pourtant ', ', donc ']) + nx[0].toLowerCase() + nx.slice(1));
        i += 2; continue;
      }
      result.push(s);
      if (result.length % every === 0 && i < sents.length - 1) {
        result.push(pick(SHORTS)); every = randInt(3, 5);
      }
      i++;
    }
    return result;
  }
  function injectPunctuation(sents) {
    return sents.map(s => {
      const r = Math.random();
      if (r < 0.18) return s.replace(/\.$/, '…');
      if (r < 0.30) {
        const w = s.split(/\s+/);
        if (w.length > 6) { w.splice(randInt(Math.floor(w.length / 3), Math.floor(2 * w.length / 3)), 0, '—'); return w.join(' '); }
      } else if (r < 0.36) {
        if (s.endsWith('.') && ['incroyable','essentiel','crucial','remarquable','évident'].some(k => s.toLowerCase().includes(k)))
          return s.slice(0, -1) + '!!';
      }
      return s;
    });
  }
  function humanizeCore(text, strength = 0.5) {
    text = removeAiStructure(text);
    text = removeAiMarkers(text);
    text = reduceTone(text);
    text = enrichVocabulary(text, strength * 0.8);
    let sents = maximizeBurstiness(hSplit(text));
    sents = injectPunctuation(sents);
    return sents.join(' ')
      .replace(/ ([,;:.!?…])/g, '$1')
      .replace(/ {2,}/g, ' ')
      .replace(/\s*—\s*/g, ' — ')
      .trim();
  }
  const applyMap = (text, map) => { for (const [src, ch] of map) text = sub(text, WR(src), ch); return text; };
  
  const HUMAN_MODES = {
    subtil:  t => humanizeCore(t, 0.25),
    fort:    t => humanizeCore(t, 0.60),
    extreme: t => {
      let s = hSplit(humanizeCore(t, 0.85));
      if (s.length > 4) {
        const core = s.slice(1, -1);
        for (let i = core.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [core[i], core[j]] = [core[j], core[i]]; }
        s = [s[0], ...core, s[s.length - 1]];
      }
      return s.join(' ');
    },
    furtif: t => {
      const out = [];
      for (const s of hSplit(humanizeCore(t, 0.70))) { out.push(s); if (Math.random() < 0.35) out.push(pick(ULTRA_SHORT)); }
      return out.join(' ');
    },
    etudiant: t => applyMap(humanizeCore(t, 0.50), [
      ["par conséquent", ["du coup","donc voilà","résultat"]],
      ["ainsi", ["du coup","donc","bref"]],
      ["important", ["vraiment clé","pas à négliger","à retenir"]],
      ["difficile", ["pas évident","galère","compliqué"]],
      ["simple", ["basique","pas compliqué","facile"]]]),
    pro: t => applyMap(humanizeCore(t, 0.35), [
      ["faire", ["mettre en œuvre","conduire","déployer"]],
      ["donner", ["fournir","apporter","offrir"]],
      ["avoir", ["disposer de","bénéficier de","posséder"]]]),
    academique: t => {
      const subs = ["ce qui soulève la question de","bien que cela mérite nuance",
                    "dès lors qu'on l'examine attentivement","à condition de contextualiser"];
      return hSplit(humanizeCore(t, 0.40)).map(s =>
        Math.random() < 0.30 && s.split(/\s+/).length > 7 ? s.replace(/[.!?]+$/, '') + ', ' + pick(subs) + '.' : s).join(' ');
    },
    journaliste: t => {
      const s = hSplit(humanizeCore(t, 0.55));
      if (s.length) { const w = s[0].split(/\s+/); if (w.length > 8) s[0] = w.slice(0, 7).join(' ') + '.'; }
      return s.join(' ');
    },
    technique: t => applyMap(humanizeCore(t, 0.30), [
      ["utilise", ["exploite","déploie","implémente"]],
      ["système", ["stack","infrastructure","architecture"]],
      ["processus", ["pipeline","workflow","flux"]],
      ["fonction", ["méthode","handler","routine"]]]),
    scientifique: t => applyMap(humanizeCore(t, 0.35), [
      ["montre", ["tend à indiquer","suggère","laisse supposer"]],
      ["prouve", ["corrobore","est cohérent avec","appuie l'idée que"]],
      ["toujours", ["généralement","dans la plupart des cas"]],
      ["jamais", ["rarement","dans très peu de cas"]]]),
    juridique: t => applyMap(humanizeCore(t, 0.25), [
      ["doit", ["est tenu de","a l'obligation de"]],
      ["peut", ["est habilité à","a la faculté de"]],
      ["accord", ["convention","disposition"]],
      ["règle", ["norme applicable","disposition réglementaire"]]]),
    medical: t => applyMap(humanizeCore(t, 0.30), [
      ["important", ["cliniquement significatif","à surveiller"]],
      ["montre", ["objective","met en évidence"]],
      ["traitement", ["prise en charge","protocole thérapeutique"]],
      ["patient", ["sujet","cas clinique","personne concernée"]]]),
    marketing: t => applyMap(humanizeCore(t, 0.45), [
      ["important", ["qui fait la différence","incontournable","décisif"]],
      ["utiliser", ["profiter de","exploiter","tirer parti de"]],
      ["améliorer", ["booster","optimiser","transformer"]]]),
    historique: t => {
      t = humanizeCore(t, 0.30);
      return t && /^\p{Lu}/u.test(t) ? "À cette époque, " + t[0].toLowerCase() + t.slice(1) : t;
    },
    philo: t => {
      const s = hSplit(humanizeCore(t, 0.35));
      if (s.length) {
        const tail = ["mais n'est-ce pas là toute la question ?","— à moins que ce ne soit l'inverse.","ce qui reste, en fin de compte, ouvert."];
        s[s.length - 1] = s[s.length - 1].replace(/[.!?]+$/, '') + ' — ' + pick(tail);
      }
      return s.join(' ');
    },
    educatif: t => {
      const out = [];
      hSplit(humanizeCore(t, 0.30)).forEach((s, i) => { out.push(s); if (i === 0 && Math.random() < 0.5) out.push("Voyons ça de plus près."); });
      return out.join(' ');
    },
  };
  const HUMAN_LABELS = {
    subtil: "Subtil", fort: "Fort", extreme: "Extrême", furtif: "Furtif", etudiant: "Étudiant",
    pro: "Professionnel", academique: "Académique", journaliste: "Journalistique", technique: "Technique",
    scientifique: "Scientifique", juridique: "Juridique", medical: "Médical", marketing: "Marketing",
    historique: "Historique", philo: "Philosophique", educatif: "Éducatif",
  };
  function humanizeText(text, mode) { return (HUMAN_MODES[mode] || HUMAN_MODES.subtil)(text); }