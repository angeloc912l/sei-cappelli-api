const axios = require('axios');

module.exports = async function entrataCasualeStrategy(params) {
  const { domanda, session_uuid, intenzione, ...rest } = params;
  const API_KEY = process.env.OPENAI_API_KEY;
  
  // Scegli l'assistant in base all'intenzione
  let ASSISTANT_ID;
  if (intenzione === 'generazione') {
    ASSISTANT_ID = process.env.OPENAI_ENTRATA_CASUALE_GENERAZIONE_ASSISTANT_ID || "asst_J4f9H0yuFZdHMyE57Q8KmpMW";
  } else {
    ASSISTANT_ID = process.env.OPENAI_ENTRATA_CASUALE_ASSISTANT_ID || "asst_J4f9H0yuFZdHMyE57Q8KmpMW";
  }

  try {
    console.log("🎯 Strategia Entrata Casuale - Assistant ID:", ASSISTANT_ID);

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

    // Genera una parola casuale
    const paroleCasuali = [
      // Natura e ambiente
      "giardino", "robot", "fiume", "orologio", "nuvole", "mare", "montagna", 
      "città", "foresta", "deserto", "oceano", "spazio", "musica", "colori",
      "animali", "macchine", "natura", "tecnologia", "arte", "sport", "cibo",
      "viaggio", "casa", "scuola", "lavoro", "tempo", "energia", "acqua",
      "fuoco", "terra", "aria", "sole", "luna", "stelle", "vento", "pioggia",
      "albero", "fiore", "erba", "sabbia", "roccia", "ghiaccio", "neve",
      "arcobaleno", "temporale", "aurora", "tramonto", "alba", "notte", "giorno",
      "stagioni", "primavera", "estate", "autunno", "inverno", "caldo", "freddo",
      
      // Oggetti e strumenti
      "libro", "penna", "computer", "telefono", "auto", "bicicletta", "treno",
      "aereo", "nave", "barca", "elicottero", "razzo", "satellite", "telescopio",
      "microscopio", "camera", "specchio", "porta", "finestra", "scala", "ponte",
      "torre", "castello", "palazzo", "chiesa", "tempio", "museo", "teatro",
      "cinema", "stazione", "aeroporto", "porto", "mercato", "negozio", "banca",
      
      // Attività e azioni
      "danza", "canto", "pittura", "scrittura", "lettura", "studio", "ricerca",
      "invenzione", "scoperta", "esplorazione", "avventura", "mistero", "segreto",
      "sogno", "fantasia", "immaginazione", "creatività", "innovazione", "progresso",
      "evoluzione", "trasformazione", "cambiamento", "crescita", "sviluppo",
      "apprendimento", "insegnamento", "comunicazione", "collaborazione", "competizione",
      
      // Emozioni e sensazioni
      "gioia", "tristezza", "paura", "coraggio", "amore", "amicizia", "fiducia",
      "speranza", "fede", "passione", "entusiasmo", "curiosità", "stupore",
      "meraviglia", "sorpresa", "eccitazione", "calma", "serenità", "pace",
      "armonia", "bellezza", "eleganza", "semplicità", "complessità", "ordine",
      "caos", "equilibrio", "bilanciamento", "integrazione", "connessione",
      
      // Concetti astratti
      "libertà", "giustizia", "verità", "saggezza", "conoscenza", "scienza",
      "filosofia", "religione", "cultura", "tradizione", "modernità", "futuro",
      "passato", "presente", "eternità", "infinito", "universo", "galassia",
      "pianeta", "sistema", "rete", "web", "digitale", "virtuale", "reale",
      "artificiale", "naturale", "organico", "sintetico", "biologico",
      
      // Materiali e elementi
      "legno", "metallo", "vetro", "plastica", "tessuto", "carta", "gomma",
      "ceramica", "marmo", "granito", "diamante", "oro", "argento", "bronzo",
      "ferro", "acciaio", "alluminio", "rame", "zinco", "piombo", "mercurio",
      "carbone", "petrolio", "gas", "elettricità", "magnetismo", "gravità",
      "luce", "ombra", "riflesso", "eco", "risonanza", "vibrazione",
      
      // Forme e dimensioni
      "cerchio", "quadrato", "triangolo", "rettangolo", "cubo", "sfera",
      "piramide", "cono", "cilindro", "spirale", "onda", "linea", "punto",
      "superficie", "volume", "altezza", "larghezza", "profondità", "distanza",
      "vicinanza", "grandezza", "piccolezza", "lunghezza", "brevità", "velocità",
      "lentezza", "peso", "leggerezza", "densità", "porosità", "trasparenza",
      
      // Colori e suoni
      "rosso", "blu", "verde", "giallo", "arancione", "viola", "rosa", "nero",
      "bianco", "grigio", "marrone", "turchese", "indaco", "magenta", "ciano",
      "suono", "rumore", "silenzio", "melodia", "ritmo", "armonia", "tono",
      "volume", "frequenza", "pitch", "bass", "treble", "eco", "riverbero",
      
      // Tempo e movimento
      "secondo", "minuto", "ora", "giorno", "settimana", "mese", "anno",
      "secolo", "millennio", "istante", "momento", "periodo", "era", "epoca",
      "movimento", "moto", "velocità", "accelerazione", "decelerazione",
      "rotazione", "rivoluzione", "orbita", "traiettoria", "percorso", "strada",
      "sentiero", "autostrada", "tunnel", "galleria", "passaggio", "corridoio",
      
      // Vita e biologia
      "cellula", "organo", "tessuto", "sistema", "organismo", "specie",
      "popolazione", "ecosistema", "biodiversità", "evoluzione", "adattamento",
      "mutazione", "genetica", "DNA", "proteina", "enzima", "ormone",
      "neurotrasmettitore", "sinapsi", "neurone", "cervello", "mente",
      "coscienza", "inconscio", "memoria", "apprendimento", "intelligenza",
      "emozione", "sentimento", "pensiero", "idea", "concetto", "teoria"
    ];
    
    const parolaCasuale = paroleCasuali[Math.floor(Math.random() * paroleCasuali.length)];
    console.log("🎲 Parola casuale generata:", parolaCasuale);

    // Step 2: Aggiungi il messaggio dell'utente al thread
    const messaggioUtente = intenzione === 'generazione' 
      ? `Strategia Entrata Casuale - Cappello Verde (Generazione): 

PROBLEMA: "${domanda}"

PAROLA CASUALE: "${parolaCasuale}"

Applica la tecnica dell'entrata casuale per generare soluzioni creative al problema.`
      : `Strategia Entrata Casuale - Cappello Verde (Valutazione): 

IDEA ORIGINALE: "${domanda}"

PAROLA CASUALE: "${parolaCasuale}"

Applica la tecnica dell'entrata casuale per generare idee creative.`;
    
    await axios.post(
      `https://api.openai.com/v1/threads/${threadID}/messages`,
      {
        role: "user",
        content: messaggioUtente,
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

    // Step 3: Avvia l'analisi del thread con l'assistente
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
      console.log("Attesa elaborazione strategia entrata casuale...");
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

    console.log("Run completato, recupero risposta strategia entrata casuale...");

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
    console.log("Risposta strategia entrata casuale ricevuta:", risposta);

    // Parsing: estrai blocco JSON e testo per Storyline
    const match = risposta.match(/```json\s*([\s\S]*?)\s*```/);
    let rispostaJSON = null;
    let rispostaTesto = risposta;
    if (match) {
      try {
        rispostaJSON = JSON.parse(match[1]);
        rispostaTesto = risposta.replace(match[0], '').trim();
      } catch (e) {
        console.error('Errore nel parsing del JSON strategia entrata casuale:', e.message);
      }
    }

    // Restituisci entrambi
    return { rispostaTesto, rispostaJSON };

  } catch (error) {
    console.error("❌ Errore API Assistant strategia entrata casuale:", error.response?.data || error.message);
    return {
      rispostaTesto: null,
      rispostaJSON: null,
      errore: error.message
    };
  }
}; 