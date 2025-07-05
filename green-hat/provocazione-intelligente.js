const axios = require('axios');

// Funzione per analizzare l'idea e decidere la tecnica
function analizzaIdeaPerTecnica(idea) {
  const ideaLower = idea.toLowerCase();
  
  // Indicatori per "metodo della fuga" (sfidare presupposti/convenzioni)
  const indicatoriFuga = [
    'sempre', 'mai', 'tutti', 'nessuno', 'sempre stato', 'tradizionalmente',
    'convenzionale', 'standard', 'normale', 'abituale', 'scontato',
    'presupposto', 'assunto', 'dato per certo', 'ovvio', 'evidente'
  ];
  
  // Indicatori per "distorsione" (procedure sequenziali)
  const indicatoriDistorsione = [
    'prima', 'poi', 'dopo', 'successivamente', 'sequenza', 'ordine',
    'passo', 'fase', 'stadio', 'processo', 'procedura', 'metodo',
    'step', 'sequenziale', 'lineare', 'progressivo', 'graduale'
  ];
  
  let punteggioFuga = 0;
  let punteggioDistorsione = 0;
  
  // Calcola punteggi
  indicatoriFuga.forEach(indicator => {
    if (ideaLower.includes(indicator)) punteggioFuga++;
  });
  
  indicatoriDistorsione.forEach(indicator => {
    if (ideaLower.includes(indicator)) punteggioDistorsione++;
  });
  
  // Logica di decisione
  if (punteggioFuga > punteggioDistorsione) {
    return 'metodo_fuga';
  } else if (punteggioDistorsione > punteggioFuga) {
    return 'distorsione';
  } else {
    // Se punteggi uguali, default a metodo della fuga
    return 'metodo_fuga';
  }
}

module.exports = async function provocazioneIntelligenteStrategy(params) {
  const { domanda, session_uuid, ...rest } = params;
  const API_KEY = process.env.OPENAI_API_KEY;
  const ASSISTANT_ID = process.env.OPENAI_PROVOCAZIONE_INTELLIGENTE_ASSISTANT_ID || "asst_default_id";

  try {
    console.log("🎯 Strategia Provocazione Intelligente - Assistant ID:", ASSISTANT_ID);

    // Step 1: Analizza l'idea e decide la tecnica
    const tecnicaScelta = analizzaIdeaPerTecnica(domanda);
    console.log(`🔍 Analisi idea completata - Tecnica scelta: ${tecnicaScelta}`);

    // Step 2: Crea un nuovo thread
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
        content: `IDEA ORIGINALE: "${domanda}"

Applica la tecnica: ${tecnicaScelta}

Leggi le istruzioni dal file corrispondente nel playground e applica rigorosamente la tecnica scelta.`
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