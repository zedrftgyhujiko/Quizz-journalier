const fs = require("fs");
const path = require("path");

const PAGES_BASE = "https://zedrftgyhujiko.github.io/Quizz-journalier";
const HISTORY_FILE = "history.json";

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  } catch (e) { console.error("Erreur history:", e.message); }
  return [];
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf8");
}

async function apiCall(messages, maxTokens = 500) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, messages }),
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const text = data.content.map(b => b.text || "").join("");
  return text.replace(/```json|```/g, "").trim();
}

async function generateTopic(history) {
  const done = history.map(h => `- ${h.topic}`).join("\n") || "Aucun thème encore fait.";

  const prompt = `Tu es un expert en anesthésie-réanimation (DESC). Tu dois choisir un thème de révision très spécifique et pointu pour un interne avancé en anesthésie-réanimation.

Thèmes déjà traités (à ne PAS répéter) :
${done}

Propose UN SEUL thème nouveau, très spécifique et clinique. Exemples du niveau attendu :
- "Gestion des anticoagulants et antiplaquettaires en périopératoire"
- "Anesthésie pour patient avec rétrécissement aortique serré"
- "Prise en charge de la défaillance ventriculaire droite aiguë"
- "Anesthésie pour césarienne en urgence (code rouge)"
- "Adaptation des traitements chroniques en préopératoire"
- "Blocs fascio-iliaques et ALR du membre inférieur"
- "Gestion d'une hémorragie obstétricale du post-partum"
- "Anesthésie du patient cirrhotique"

Réponds UNIQUEMENT en JSON valide :
{ "topic": "Titre spécifique et clinique du thème", "cat": "Catégorie courte (ex: Cardio-anesthésie, Obstétrique, ALR, Périopératoire, Réa neurologique...)" }`;

  const raw = await apiCall([{ role: "user", content: prompt }], 300);
  return JSON.parse(raw);
}

async function generateContent(topic) {
  const prompt = `Tu es un expert en anesthésie-réanimation (DESC) et un excellent pédagogue. Génère une fiche de révision niveau DESC + 10 QCM sur : "${topic}".

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "course": {
    "intro": "Introduction clinique percutante (3-4 phrases)",
    "sections": [
      { "title": "Définitions / Rappels", "content": "..." },
      { "title": "Évaluation préopératoire / Physiopathologie", "content": "..." },
      { "title": "Stratégie anesthésique / Prise en charge", "content": "..." },
      { "title": "Complications et leur gestion", "content": "..." },
      { "title": "Points clés des recommandations", "content": "Références SFAR, ESA, ESICM, SRLF récentes..." }
    ],
    "keypoints": ["Point clé 1", "Point clé 2", "Point clé 3", "Point clé 4", "Point clé 5"],
    "references": ["SFAR 20XX – ...", "ESA 20XX – ..."]
  },
  "questions": [
    {
      "num": 1,
      "difficulty": "difficile",
      "context": "Contexte clinique précis (optionnel, 1-2 phrases)",
      "question": "Question précise niveau DESC ?",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct": "B",
      "explanation": "Explication rigoureuse 2-3 phrases avec le piège principal."
    }
  ]
}

Règles : fiche dense et à jour (dernières recommandations), 10 questions toutes de niveau difficile/expert, distracteurs très plausibles inspirés d'erreurs classiques d'internes avancés.`;

  const raw = await apiCall([{ role: "user", content: prompt }], 8000);
  return JSON.parse(raw);
}

function catColor(cat) {
  const map = {
    "Cardio-anesthésie":   { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
    "Obstétrique":         { bg: "#fce7f3", text: "#831843", border: "#f9a8d4" },
    "ALR":                 { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
    "Périopératoire":      { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
    "Réa neurologique":    { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },
    "Réanimation":         { bg: "#dcfce7", text: "#14532d", border: "#86efac" },
    "Urgences vitales":    { bg: "#ffedd5", text: "#7c2d12", border: "#fdba74" },
    "Voies aériennes":     { bg: "#ccfbf1", text: "#134e4a", border: "#5eead4" },
    "Pédiatrie":           { bg: "#fdf4ff", text: "#581c87", border: "#e879f9" },
    "Pharmacologie":       { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
  };
  for (const key of Object.keys(map)) {
    if (cat && cat.toLowerCase().includes(key.toLowerCase())) return map[key];
  }
  return { bg: "#f1f5f9", text: "#334155", border: "#cbd5e1" };
}

function generateDailyHTML(entry) {
  const { date, dateStr, topic, cat, course, questions } = entry;
  const c = catColor(cat);
  const qData = JSON.stringify(questions);

  const sectionsHTML = course.sections.map(s =>
    `<div class="section"><div class="section-title">${s.title}</div><div class="section-content">${s.content.replace(/\n/g, "<br>")}</div></div>`
  ).join("");

  const keypointsHTML = course.keypoints.map(k =>
    `<div class="keypoint"><span class="kp-dot">◆</span>${k}</div>`
  ).join("");

  const refsHTML = course.references.map(r =>
    `<div class="ref">📄 ${r}</div>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AR – ${topic}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f8;min-height:100vh;padding:16px}
.container{max-width:680px;margin:0 auto}
.back{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#64748b;text-decoration:none;margin-bottom:12px;padding:6px 12px;background:white;border-radius:8px;border:1px solid #e2e8f0}
.back:hover{background:#f8fafc}
.header{background:#1a3a5c;color:white;border-radius:16px;padding:20px;margin-bottom:16px}
.header-meta{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.cat-badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${c.bg};color:${c.text}}
.header-date{font-size:12px;opacity:0.7}
.header-topic{font-size:18px;font-weight:700;line-height:1.4}
.tabs{display:flex;gap:8px;margin-bottom:16px}
.tab{flex:1;padding:10px;background:white;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;color:#64748b;text-align:center}
.tab.active{background:#1a3a5c;color:white;border-color:#1a3a5c}
.card{background:white;border-radius:16px;padding:20px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.intro{font-size:15px;line-height:1.7;color:#334155;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #f1f5f9}
.section{margin-bottom:16px}
.section-title{font-size:13px;font-weight:700;color:#1a3a5c;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
.section-content{font-size:14px;line-height:1.7;color:#475569}
.kp-box{background:#eff6ff;border-radius:12px;padding:16px;margin-bottom:16px}
.kp-title{font-size:12px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px}
.keypoint{font-size:14px;color:#1e40af;line-height:1.5;margin-bottom:6px;display:flex;gap:8px}
.kp-dot{color:#3b82f6;flex-shrink:0}
.refs-box{background:#f8fafc;border-radius:12px;padding:14px}
.refs-title{font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
.ref{font-size:12px;color:#64748b;margin-bottom:4px;line-height:1.5}
.progress-wrap{background:#e2e8f0;border-radius:4px;height:4px;margin-bottom:16px}
.progress-fill{background:#1a3a5c;height:4px;border-radius:4px;transition:width .3s}
.q-meta{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px}
.diff-facile{color:#059669}.diff-intermediaire{color:#d97706}.diff-difficile{color:#dc2626}.diff-expert{color:#7c3aed}
.q-context{font-size:13px;color:#64748b;line-height:1.5;margin-bottom:10px;padding:10px 12px;background:#f8fafc;border-radius:8px;border-left:3px solid #1a3a5c}
.q-text{font-size:16px;font-weight:600;line-height:1.5;color:#1e293b;margin-bottom:14px}
.opts{display:flex;flex-direction:column;gap:8px}
.opt{display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:10px;cursor:pointer;background:white;text-align:left;font-size:14px;line-height:1.4;color:#334155;width:100%}
.opt:hover:not(:disabled){border-color:#1a3a5c;background:#f0f7ff}
.opt-l{font-weight:700;color:#1a3a5c;min-width:18px}
.opt.correct{border-color:#059669;background:#d1fae5;color:#064e3b}
.opt.correct .opt-l{color:#059669}
.opt.wrong{border-color:#dc2626;background:#fee2e2;color:#7f1d1d}
.opt.wrong .opt-l{color:#dc2626}
.opt.reveal{border-color:#059669;background:#d1fae5;color:#064e3b}
.opt:disabled{cursor:default}
.expl{margin-top:14px;padding:12px 14px;background:#eff6ff;border-radius:10px;border-left:3px solid #1a3a5c;font-size:13px;line-height:1.6;color:#1e40af}
.btn{display:block;width:100%;margin-top:14px;padding:13px;background:#1a3a5c;color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer}
.btn:hover{opacity:.9}
.btn-sec{background:#f1f5f9;color:#1e293b}
.score-wrap{text-align:center;padding:10px 0 16px}
.score-big{font-size:64px;font-weight:700;color:#1a3a5c;line-height:1}
.score-pct{font-size:18px;color:#64748b;margin-top:4px}
.score-msg{font-size:15px;font-weight:600;margin-top:10px;color:#1e293b}
.review-item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9}
.r-icon{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
.r-ok{background:#d1fae5;color:#059669}.r-ko{background:#fee2e2;color:#dc2626}
.r-q{font-size:13px;color:#1e293b;line-height:1.4}
.r-ans{font-size:12px;color:#64748b;margin-top:2px}
</style>
</head>
<body>
<div class="container">
  <a href="./index.html" class="back">← Menu des révisions</a>
  <div class="header">
    <div class="header-meta">
      <span class="cat-badge">${cat}</span>
      <span class="header-date">${dateStr}</span>
    </div>
    <div class="header-topic">${topic}</div>
  </div>
  <div class="tabs">
    <button class="tab active" id="tab-cours" onclick="showTab('cours')">📖 Cours</button>
    <button class="tab" id="tab-quiz" onclick="showTab('quiz')">🎯 Quiz · 10 questions</button>
  </div>
  <div id="cours-panel">
    <div class="card">
      <div class="intro">${course.intro}</div>
      ${sectionsHTML}
    </div>
    <div class="card">
      <div class="kp-box">
        <div class="kp-title">⚡ Points clés à retenir</div>
        ${keypointsHTML}
      </div>
      <div class="refs-box">
        <div class="refs-title">📚 Références</div>
        ${refsHTML}
      </div>
    </div>
    <button class="btn" onclick="showTab('quiz')">Passer au quiz →</button>
  </div>
  <div id="quiz-panel" style="display:none">
    <div id="quiz-app"></div>
  </div>
</div>
<script>
function showTab(t){
  document.getElementById('cours-panel').style.display=t==='cours'?'block':'none';
  document.getElementById('quiz-panel').style.display=t==='quiz'?'block':'none';
  document.getElementById('tab-cours').className='tab'+(t==='cours'?' active':'');
  document.getElementById('tab-quiz').className='tab'+(t==='quiz'?' active':'');
  if(t==='quiz') renderQuiz();
}
const QS=${qData};
let cur=0,sel=null,rev=false,ans=[],started=false;
function scoreMsg(s,t){const p=s/t;if(p>=0.9)return"Excellent ! Niveau DESC solide.";if(p>=0.7)return"Bon niveau, consolide les lacunes.";if(p>=0.5)return"Correct, révisions nécessaires.";return"À retravailler en priorité.";}
function renderQuiz(){
  const app=document.getElementById('quiz-app');
  if(!started){started=true;cur=0;sel=null;rev=false;ans=[];}
  if(cur>=QS.length){
    const score=ans.filter((a,i)=>a===QS[i].correct).length;
    let h='<div class="card"><div class="score-wrap"><div class="score-big">'+score+'/'+QS.length+'</div><div class="score-pct">'+Math.round(score/QS.length*100)+'%</div><div class="score-msg">'+scoreMsg(score,QS.length)+'</div></div></div><div class="card"><div style="font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">Récapitulatif</div>';
    QS.forEach((q,i)=>{const ok=ans[i]===q.correct;h+='<div class="review-item"><div class="r-icon '+(ok?'r-ok':'r-ko')+'">'+(ok?'✓':'✗')+'</div><div><div class="r-q">Q'+q.num+'. '+q.question+'</div>'+(!ok?'<div class="r-ans">Ta réponse : '+(ans[i]||'—')+' · Bonne réponse : '+q.correct+'</div>':'')+'</div></div>';});
    h+='<button class="btn btn-sec" style="margin-top:16px" onclick="restartQuiz()">Recommencer</button></div>';
    app.innerHTML=h;return;
  }
  const q=QS[cur];
  const pct=(cur/QS.length*100).toFixed(0);
  const dc='diff-'+(q.difficulty||'difficile').replace('é','e').replace('è','e');
  let h='<div class="progress-wrap"><div class="progress-fill" style="width:'+pct+'%"></div></div><div style="font-size:13px;color:#64748b;margin-bottom:12px">Question '+(cur+1)+' / '+QS.length+'</div><div class="card"><div class="q-meta"><span class="'+dc+'">'+q.difficulty+'</span></div>';
  if(q.context)h+='<div class="q-context">'+q.context+'</div>';
  h+='<div class="q-text">'+q.question+'</div><div class="opts" id="opts">';
  ['A','B','C','D'].forEach(l=>{let cls='';if(rev){if(l===q.correct)cls=sel===l?'correct':'reveal';else if(l===sel)cls='wrong';}h+='<button class="opt '+cls+'" data-l="'+l+'"'+(rev?' disabled':'')+"><span class='opt-l'>"+l+"</span><span>"+q.options[l]+"</span></button>";});
  h+='</div>';
  if(rev)h+='<div class="expl"><strong>Réponse : '+q.correct+'</strong> — '+q.explanation+'</div><button class="btn" onclick="nextQ()">'+(cur<QS.length-1?'Question suivante →':'Voir les résultats →')+'</button>';
  h+='</div>';
  app.innerHTML=h;
  if(!rev)document.getElementById('opts').addEventListener('click',e=>{const b=e.target.closest('[data-l]');if(!b)return;sel=b.dataset.l;ans[cur]=sel;rev=true;renderQuiz();});
}
function nextQ(){cur++;sel=null;rev=false;renderQuiz();}
function restartQuiz(){cur=0;sel=null;rev=false;ans=[];started=false;renderQuiz();}
</script>
</body>
</html>`;
}

function generateIndexHTML(history) {
  const cards = [...history].reverse().map(e => {
    const c = catColor(e.cat);
    return `<a href="./${e.date}.html" class="card-link">
      <div class="card" style="border-left:4px solid ${c.border}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span class="badge" style="background:${c.bg};color:${c.text}">${e.cat}</span>
          <span class="card-date">${e.dateStr}</span>
        </div>
        <div class="card-topic">${e.topic}</div>
      </div>
    </a>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Révisions AR</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f8;padding:16px}
.container{max-width:680px;margin:0 auto}
.header{background:#1a3a5c;color:white;border-radius:16px;padding:24px;margin-bottom:20px}
.header-title{font-size:22px;font-weight:700;margin-bottom:4px}
.header-sub{font-size:14px;opacity:.75}
.stats{display:flex;gap:12px;margin-top:16px}
.stat{background:rgba(255,255,255,.15);border-radius:10px;padding:10px 16px;text-align:center;flex:1}
.stat-num{font-size:24px;font-weight:700}
.stat-label{font-size:11px;opacity:.8;margin-top:2px}
.section-title{font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px}
.card-link{text-decoration:none;display:block;margin-bottom:10px}
.card{background:white;border-radius:14px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.08);transition:transform .15s}
.card:hover{transform:translateY(-1px);box-shadow:0 3px 8px rgba(0,0,0,.12)}
.badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px}
.card-date{font-size:12px;color:#94a3b8}
.card-topic{font-size:15px;font-weight:600;color:#1e293b;line-height:1.4;margin-top:4px}
</style>
</head><body>
<div class="container">
  <div class="header">
    <div class="header-title">Mes révisions AR</div>
    <div class="header-sub">Anesthésie-Réanimation · DESC</div>
    <div class="stats">
      <div class="stat"><div class="stat-num">${history.length}</div><div class="stat-label">Séances</div></div>
      <div class="stat"><div class="stat-num">${history.length * 10}</div><div class="stat-label">Questions</div></div>
    </div>
  </div>
  <div class="section-title">Toutes les séances</div>
  ${cards || '<div style="text-align:center;padding:40px;color:#94a3b8;font-size:14px">Aucune séance pour l\'instant</div>'}
</div>
</body></html>`;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY manquante");
  if (!process.env.NTFY_TOPIC) throw new Error("NTFY_TOPIC manquante");

  const history = loadHistory();

  console.log("Génération du thème du jour...");
  const topicObj = await generateTopic(history);
  console.log(`Thème : ${topicObj.topic} [${topicObj.cat}]`);

  console.log("Génération cours + 10 questions...");
  const content = await generateContent(topicObj.topic);
  console.log(`Cours + ${content.questions.length} questions générés`);

  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  const dateStr = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const entry = { date, dateStr, topic: topicObj.topic, cat: topicObj.cat, course: content.course, questions: content.questions };
  history.push(entry);
  saveHistory(history);

  fs.mkdirSync("docs", { recursive: true });
  for (const e of history) {
    fs.writeFileSync(path.join("docs", `${e.date}.html`), generateDailyHTML(e), "utf8");
  }
  fs.writeFileSync(path.join("docs", "index.html"), generateIndexHTML(history), "utf8");
  console.log(`docs/ prêt : ${history.length} séances`);
}

main().catch(err => { console.error("Erreur :", err.message); process.exit(1); });
