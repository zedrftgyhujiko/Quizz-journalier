const TOPICS = [
  "Voies aeriennes et intubation difficile",
  "Pharmacologie anesthesique (curares, morphiniques, halogenes)",
  "Etats de choc (septique, hemorragique, anaphylactique, cardiogenique)",
  "Reanimation cardio-pulmonaire (RCP adulte)",
  "Anesthesie locoregionale (rachianesthesie, peridurale, blocs peripheriques)",
  "Ventilation mecanique et syndrome de detresse respiratoire aigue",
  "Sedation-analgesie en reanimation",
  "Analgesie et prise en charge de la douleur aigue",
  "Pancreatite aigue severe",
  "Meningites bacteriennes et encephalites",
  "Hemostase, coagulopathies et transfusion",
  "Monitorage peroperatoire (BIS, TOF, Vigileo)",
  "Sepsis et choc septique (Surviving Sepsis Campaign)",
  "Insuffisance renale aigue en reanimation",
  "Traumatologie grave et damage control",
  "Anesthesie du patient a estomac plein",
  "Complications peranesthesiques (hypotension, bronchospasme, allergie)",
  "Periode postoperatoire et SSPI",
];

function getTodayTopic() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return TOPICS[dayOfYear % TOPICS.length];
}

async function generateQuiz(topic) {
  const systemPrompt = `Tu es un formateur expert en anesthesie-reanimation pour internes francais (DES/DESC). Genere exactement 5 questions QCM cliniques de niveau DESC sur : "${topic}".

Reponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou apres. Format strict :
{
  "topic": "${topic}",
  "questions": [
    {
      "num": 1,
      "difficulty": "intermediaire",
      "question": "Question clinique precise ?",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct": "B",
      "explanation": "Explication pedagogique concise en 2-3 phrases."
    }
  ]
}

Regles : contextes cliniques realistes, une seule bonne reponse, distracteurs plausibles, references aux guidelines recentes. Varie les difficultes : 2 faciles, 2 intermediaires, 1 difficile.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: `Genere 5 QCM sur : ${topic}` }],
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

function formatMessage(quiz) {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  let msg = `Quiz du jour - ${quiz.topic}\n`;
  msg += `${today}\n\n`;

  for (const q of quiz.questions) {
    const level = q.difficulty === "difficile" ? "[Difficile]" : q.difficulty === "intermediaire" ? "[Moyen]" : "[Facile]";
    msg += `Q${q.num} ${level}\n`;
    msg += `${q.question}\n`;
    msg += `A) ${q.options.A}\n`;
    msg += `B) ${q.options.B}\n`;
    msg += `C) ${q.options.C}\n`;
    msg += `D) ${q.options.D}\n\n`;
  }

  msg += `-------- REPONSES --------\n\n`;

  for (const q of quiz.questions) {
    msg += `Q${q.num} -> ${q.correct} : ${q.explanation}\n\n`;
  }

  return msg.trim();
}

async function sendNotification(topic, message, ntfyTopic) {
  const title = `Quiz AR - ${topic.split("(")[0].trim()}`;
  const encoded = Buffer.from(message, "utf8");

  const response = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Title": Buffer.from(title, "utf8").toString("latin1"),
      "Priority": "default",
      "Tags": "stethoscope",
    },
    body: encoded,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ntfy erreur ${response.status}: ${err}`);
  }

  console.log(`Notification envoyee sur ntfy.sh/${ntfyTopic}`);
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const ntfyTopic = process.env.NTFY_TOPIC;

  if (!apiKey) throw new Error("Variable ANTHROPIC_API_KEY manquante");
  if (!ntfyTopic) throw new Error("Variable NTFY_TOPIC manquante");

  const topic = getTodayTopic();
  console.log(`Theme du jour : ${topic}`);

  console.log("Generation du quiz...");
  const quiz = await generateQuiz(topic);
  console.log(`${quiz.questions.length} questions generees`);

  const message = formatMessage(quiz);
  console.log("Envoi de la notification...");
  await sendNotification(topic, message, ntfyTopic);

  console.log("Quiz du jour envoye avec succes !");
}

main().catch((err) => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
