const axios = require('axios');

module.exports = async function provocazioneIntelligenteStrategy(params) {
  const { domanda, session_uuid, ...rest } = params;
  const API_KEY = process.env.OPENAI_API_KEY;
  const ASSISTANT_ID = process.env.OPENAI_PROVOCAZIONE_INTELLIGENTE_ASSISTANT_ID || "asst_default_id";

  try {
    console.log("🎯 Strategia Provocazione Intelligente - Assistant ID:", ASSISTANT_ID);

    // Step 1: Crea un nuovo thread
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

    // Step 2: Aggiungi il messaggio dell'utente al thread
    const messaggioUtente = `IDEA ORIGINALE: "${domanda}"

Analizza l'idea e decidi quale tecnica applicare, poi applicala.

IMPORTANTE: Se scegli "metodo_fuga", leggi le istruzioni dal file "verde-valutazione-metodo-fuga.txt" nel playground e applica rigorosamente i passaggi indicati.

Se scegli "distorsione", leggi le istruzioni dal file "verde-valutazione-distorsione.txt" nel playground e applica rigorosamente i passaggi indicati.

RICORDA: Il metodo della fuga deve generare idee RADICALMENTE DIVERSE dall'originale, non semplici variazioni. Sfida i presupposti in modo controversiale e rivoluzionario.

Assicurati di seguire esattamente le istruzioni del file corrispondente.`;

    console.log("📤 Messaggio inviato all'assistante per analisi e applicazione automatica");
    console.log("📋 Istruzioni per l'assistant:");
    console.log("   - Deve decidere tra metodo_fuga o distorsione");
    console.log("   - Deve leggere il file corrispondente nel playground");
    console.log("   - Deve applicare rigorosamente le istruzioni del file");
    
    await axios.post(
      `https://api.openai.com/v1/threads/${threadID}/messages`,
      {
        role: "user",
        content: messaggioUtente
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

    // Step 3: Avvia l'analisi del thread con l'assistante
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

    // Step 4: Attendi la risposta elaborata
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

    // Step 5: Recupera la risposta finale
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
    
    // Analisi della risposta per verificare se segue le istruzioni
    console.log("🔍 Analisi della risposta dell'assistant:");
    console.log("   - Contiene 'metodo_fuga' o 'distorsione':", risposta.includes('metodo_fuga') || risposta.includes('distorsione'));
    console.log("   - Contiene 'provocazione':", risposta.includes('provocazione'));
    console.log("   - Contiene 'idee_alternative':", risposta.includes('idee_alternative'));
    console.log("   - Contiene JSON strutturato:", risposta.includes('```json'));
    console.log("   - Inizia con 'Ciao, eccomi':", risposta.startsWith('Ciao, eccomi'));
    console.log("   - Lunghezza risposta:", risposta.length, "caratteri");

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