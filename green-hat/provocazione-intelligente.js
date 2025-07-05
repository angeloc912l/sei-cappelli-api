const axios = require('axios');

module.exports = async function provocazioneIntelligenteStrategy(params) {
  const { domanda, session_uuid, ...rest } = params;
  const API_KEY = process.env.OPENAI_API_KEY;
  const ASSISTANT_ID = process.env.OPENAI_PROVOCAZIONE_INTELLIGENTE_ASSISTANT_ID || "asst_default_id";

  try {
    console.log("🎯 Strategia Provocazione Intelligente - Assistant ID:", ASSISTANT_ID);

    // Step 1: Analisi dell'idea per decidere la tecnica
    const threadAnalisiResponse = await axios.post(
      "https://api.openai.com/v1/threads",
      {},
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
      }
    );
    const threadAnalisiID = threadAnalisiResponse.data.id;
    
    await axios.post(
      `https://api.openai.com/v1/threads/${threadAnalisiID}/messages`,
      {
        role: "user",
        content: `Analizza questa idea e decidi quale tecnica di provocazione applicare:

IDEA: "${domanda}"

CRITERI:
- METODO DELLA FUGA: Se l'idea contiene principi/convenzioni che si danno per scontati
- DISTORSIONE: Se l'idea contiene procedure sequenziali standard

Rispondi solo con: "metodo_fuga" o "distorsione"`
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
      }
    );

    const runAnalisi = await axios.post(
      `https://api.openai.com/v1/threads/${threadAnalisiID}/runs`,
      { assistant_id: ASSISTANT_ID },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
      }
    );

    let statusAnalisi = runAnalisi.data.status;
    while (statusAnalisi !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const checkStatus = await axios.get(
        `https://api.openai.com/v1/threads/${threadAnalisiID}/runs/${runAnalisi.data.id}`,
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2"
          },
        }
      );
      statusAnalisi = checkStatus.data.status;
    }

    const rispostaAnalisi = await axios.get(
      `https://api.openai.com/v1/threads/${threadAnalisiID}/messages`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
      }
    );

    const tecnicaScelta = rispostaAnalisi.data.data[0].content[0].text.value.trim();
    console.log("🎯 Tecnica scelta:", tecnicaScelta);

    // Step 2: Crea thread per l'applicazione della tecnica
    const threadResponse = await axios.post(
      "https://api.openai.com/v1/threads",
      {},
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
      }
    );
    const threadID = threadResponse.data.id;
    console.log("Thread creato con ID:", threadID);

    // Step 3: Aggiungi il messaggio dell'utente al thread
    await axios.post(
      `https://api.openai.com/v1/threads/${threadID}/messages`,
      {
        role: "user",
        content: `Strategia Provocazione Intelligente - Cappello Verde:

IDEA ORIGINALE: "${domanda}"

TECNICA APPLICATA: ${tecnicaScelta}

Leggi le istruzioni dal file: ${tecnicaScelta === 'metodo_fuga' ? 'verde-valutazione-metodo-fuga.txt' : 'verde-valutazione-distorsione.txt'}

Applica rigorosamente le istruzioni del file specificato.

Rispondi sempre:
1. Inizia con una risposta motivante e chiara (max 2-3 frasi) che spiega l'idea migliore e i suoi benefici, senza scrivere un report.
2. Subito dopo, restituisci solo il blocco JSON strutturato come segue, racchiuso tra \`\`\`json e \`\`\`:

{
  "scopo": {
    "testo": "...",
    "tecnica_scelta": "...",
    "provocazione": "...",
    "idee_alternative": ["...", "...", "..."]
  },
  "valutazione": {
    "fattibilita": "...",
    "vantaggi": "...",
    "risorse": "...",
    "adeguatezza": "...",
    "idea_migliore": "..."
  }
}

Non aggiungere altro testo, spiegazione o passaggio.`
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
      }
    );
    console.log("Messaggio utente aggiunto al thread");

    // Step 4: Avvia l'analisi del thread con l'assistante
    const runResponse = await axios.post(
      `https://api.openai.com/v1/threads/${threadID}/runs`,
      {
        assistant_id: ASSISTANT_ID
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
      }
    );

    let status = runResponse.data.status;
    let runID = runResponse.data.id;
    console.log("Run avviato con ID:", runID);

    // Step 5: Attendi la risposta elaborata
    while (status !== "completed") {
      console.log("Attesa elaborazione strategia provocazione intelligente...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const checkRunStatus = await axios.get(
        `https://api.openai.com/v1/threads/${threadID}/runs/${runID}`,
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2"
          },
        }
      );
      status = checkRunStatus.data.status;
    }

    console.log("Run completato, recupero risposta strategia provocazione intelligente...");

    // Step 6: Recupera la risposta finale
    const finalMessagesResponse = await axios.get(
      `https://api.openai.com/v1/threads/${threadID}/messages`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
      }
    );

    const risposta = finalMessagesResponse.data.data[0].content[0].text.value;
    console.log("Risposta strategia provocazione intelligente ricevuta:", risposta);

    // Parsing: estrai blocco JSON e testo per Storyline
    const match = risposta.match(/```json\s*([\s\S]*?)\s*```/);
    let rispostaJSON = null;
    let rispostaTesto = risposta;
    if (match) {
      try {
        rispostaJSON = JSON.parse(match[1]);
        rispostaTesto = risposta.replace(match[0], '').trim();
      } catch (e) {
        console.error('Errore nel parsing del JSON strategia provocazione intelligente:', e.message);
      }
    }

    // Restituisci entrambi
    return { rispostaTesto, rispostaJSON };

  } catch (error) {
    console.error("❌ Errore API Assistant strategia provocazione intelligente:", error.response?.data || error.message);
    return {
      rispostaTesto: null,
      rispostaJSON: null,
      errore: error.message
    };
  }
}; 