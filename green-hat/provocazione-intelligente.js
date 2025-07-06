const axios = require('axios');

// Funzione per analizzare l'idea e decidere la tecnica usando un mix di strategie
function analizzaIdeaPerTecnica(idea) {
  const ideaLower = idea.toLowerCase();
  let punteggioFuga = 0;
  let punteggioDistorsione = 0;
  
  // 1. ANALISI PAROLE CHIAVE (40% del peso)
  const indicatoriFuga = [
    'sempre', 'mai', 'tutti', 'nessuno', 'tradizionalmente',
    'convenzionale', 'standard', 'normale', 'abituale', 'scontato',
    'presupposto', 'assunto', 'dato per certo', 'ovvio', 'evidente'
  ];
  
  const indicatoriDistorsione = [
    'prima', 'poi', 'dopo', 'successivamente', 'sequenza', 'ordine',
    'passo', 'fase', 'stadio', 'processo', 'procedura', 'metodo',
    'step', 'sequenziale', 'lineare', 'progressivo', 'graduale'
  ];
  
  indicatoriFuga.forEach(indicator => {
    if (ideaLower.includes(indicator)) punteggioFuga += 2;
  });
  
  indicatoriDistorsione.forEach(indicator => {
    if (ideaLower.includes(indicator)) punteggioDistorsione += 2;
  });
  
  // 2. ANALISI LUNGHEZZA (20% del peso)
  if (idea.length < 50) {
    punteggioFuga += 1;
  } else {
    punteggioDistorsione += 1;
  }
  
  // 3. ANALISI PATTERN LINGUISTICI (30% del peso)
  if (idea.includes('come') || idea.includes('?') || idea.includes('perché')) {
    punteggioFuga += 1.5;
  }
  
  if (idea.includes('creare') || idea.includes('sviluppare') || idea.includes('fare')) {
    punteggioDistorsione += 1.5;
  }
  
  // 4. ANALISI COMPLESSITÀ (10% del peso)
  const parole = idea.split(' ').length;
  if (parole > 10) {
    punteggioDistorsione += 1;
  } else {
    punteggioFuga += 1;
  }
  
  // DECISIONE FINALE
  if (punteggioFuga > punteggioDistorsione) {
    return 'metodo_fuga';
  } else {
    return 'distorsione';
  }
}

module.exports = async function provocazioneIntelligenteStrategy(params) {
  const { domanda, session_uuid, intenzione, ...rest } = params;
  const API_KEY = process.env.OPENAI_API_KEY;
  
  // Scegli l'assistant in base alla tecnica e all'intenzione
  const tecnicaScelta = analizzaIdeaPerTecnica(domanda);
  let ASSISTANT_ID;
  
  if (intenzione === 'generazione') {
    if (tecnicaScelta === 'metodo_fuga') {
      ASSISTANT_ID = process.env.OPENAI_METODO_FUGA_GENERAZIONE_ASSISTANT_ID || "asst_default_id";
      console.log("🎯 Strategia Metodo della Fuga (Generazione) - Assistant ID:", ASSISTANT_ID);
    } else {
      ASSISTANT_ID = process.env.OPENAI_DISTORSIONE_GENERAZIONE_ASSISTANT_ID || "asst_default_id";
      console.log("🎯 Strategia Distorsione (Generazione) - Assistant ID:", ASSISTANT_ID);
    }
  } else {
    if (tecnicaScelta === 'metodo_fuga') {
      ASSISTANT_ID = process.env.OPENAI_METODO_FUGA_ASSISTANT_ID || "asst_default_id";
      console.log("🎯 Strategia Metodo della Fuga (Valutazione) - Assistant ID:", ASSISTANT_ID);
    } else {
      ASSISTANT_ID = process.env.OPENAI_DISTORSIONE_ASSISTANT_ID || "asst_default_id";
      console.log("🎯 Strategia Distorsione (Valutazione) - Assistant ID:", ASSISTANT_ID);
    }
  }

  try {
    console.log(`🔍 Analisi idea completata - Tecnica scelta: ${tecnicaScelta}`);

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
    const messaggioUtente = intenzione === 'generazione'
      ? `PROBLEMA ORIGINALE: "${domanda}"

Applica la tecnica: ${tecnicaScelta}

Leggi le istruzioni dal file corrispondente nel playground e applica rigorosamente la tecnica scelta per generare soluzioni creative al problema.`
      : `IDEA ORIGINALE: "${domanda}"

Applica la tecnica: ${tecnicaScelta}

Leggi le istruzioni dal file corrispondente nel playground e applica rigorosamente la tecnica scelta.`;

    console.log(`📤 Messaggio inviato all'assistante con tecnica: ${tecnicaScelta}`);
    
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