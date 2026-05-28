const TOPICS = [
  "Voies aériennes et intubation difficile",
  "Pharmacologie anesthésique (curares, morphiniques, halogénés)",
  "États de choc (septique, hémorragique, anaphylactique, cardiogénique)",
  "Réanimation cardio-pulmonaire (RCP adulte)",
  "Anesthésie locorégionale (rachianesthésie, péridurale, blocs périphériques)",
  "Ventilation mécanique et syndrome de détresse respiratoire aiguë",
  "Sédation-analgésie en réanimation",
  "Analgésie et prise en charge de la douleur aiguë",
  "Pancréatite aiguë sévère",
  "Méningites bactériennes et encéphalites",
  "Hémostase, coagulopathies et transfusion",
  "Monitorage peropératoire (BIS, TOF, Vigileo...)",
  "Sepsis et choc septique (Surviving Sepsis Campaign)",
  "Insuffisance rénale aiguë en réanimation",
  "Traumatologie grave et damage control",
  "Anesthésie du patient à estomac plein",
  "Complications peranesthésiques (hypotension, bronchospasme, allergie...)",
  "Période postopératoire et SSPI",
];

function getTodayTopic() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return TOPICS[dayOfYear % TOPICS.length];
}

async function generateQuiz(topic) {
  const systemPrompt = `Tu es un formateur expert en anesthésie-réanimation pour internes français (DES/DESC). Génère exactement 5 questions QCM cliniques de niveau DESC sur : "${topic}".

Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après. Format strict :
{
  "topic": "${topic}",
  "questions": [
    {
      "num": 1,
      "difficulty": "intermédiaire",
      "question": "Question clinique précise ?",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct": "B",
      "explanation": "Explication pédagogique concise en 2-3 phrases, avec le piège principal."
    }
  ]
}

Règles impératives :
- Contextes cliniques réalistes (sexe/âge/paramètres vitaux)
- Une seule bonne réponse par question
- Distracteurs plausibles qui correspondent à des erreurs classiques d'internes
- Référence aux guidelines françaises/européennes récentes quand pertinent
- Varie les difficultés : 2 faciles, 2 intermédiaires, 1 difficile`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: `Génère 5 QCM sur : ${topic}` }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Anthropic erreur ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content.map((b) => b.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function formatQuestionsMessage(quiz) {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  let msg = `📅 ${today}\n\n`;

  for (const q of quiz.questions) {
    const badge = q.difficulty === "difficile" ? "🔴" : q.difficulty === "intermédiaire" ? "🟡" : "🟢";
    msg += `${badge} Q${q.num}. ${q.question}\n`;
    msg += `   A) ${q.options.A}\n`;
    msg += `   B) ${q.options.B}\n`;
    msg += `   C) ${q.options.C}\n`;
    msg += `   D) ${q.options.D}\n\n`;
  }

  msg += `━━━━━━━━━━━━━━━\n`;
  msg += `💡 Réponses ci-dessous — réfléchis d'abord !\n`;
  msg += `━━━━━━━━━━━━━━━\n\n`;

  for (const q of quiz.questions) {
    msg += `Q${q.num} → ${q.correct} : ${q.explanation}\n\n`;
  }

  return msg.trim();
}

async function sendNtfyNotification(topic, message, ntfyTopic) {
  const title = `🏥 Quiz du jour — ${topic.split("(")[0].trim()}`;

  const response = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Title: title,
      Priority: "default",
      Tags: "stethoscope,brain",
    },
    body: message,
  });

  if (!response.ok) {
    throw new Error(`ntfy erreur ${response.status}`);
  }

  console.log(`✅ Notification envoyée sur ntfy.sh/${ntfyTopic}`);
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const ntfyTopic = process.env.NTFY_TOPIC;

  if (!apiKey) throw new Error("Variable ANTHROPIC_API_KEY manquante");
  if (!ntfyTopic) throw new Error("Variable NTFY_TOPIC manquante");

  // Patch fetch pour inclure la clé API Anthropic
  const originalFetch = global.fetch;
  global.fetch = (url, options = {}) => {
    if (url.includes("anthropic.com")) {
      options.headers = {
        ...options.headers,
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      };
    }
    return originalFetch(url, options);
  };

  const topic = getTodayTopic();
  console.log(`📚 Thème du jour : ${topic}`);

  console.log("⏳ Génération du quiz...");
  const quiz = await generateQuiz(topic);
  console.log(`✅ ${quiz.questions.length} questions générées`);

  const message = formatQuestionsMessage(quiz);
  console.log("📤 Envoi de la notification...");
  await sendNtfyNotification(topic, message, ntfyTopic);

  console.log("🎉 Quiz du jour envoyé avec succès !");
}

main().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
