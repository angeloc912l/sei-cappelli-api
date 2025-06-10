const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = "asst_J4f9H0yuFZdHMyE57Q8KmpMW";

async function callAssistantAPI(domanda) {
  try {
    console.log("Assistant ID:", ASSISTANT_ID); 
    console.log("API Key:", API_KEY ? "✅ API Key presente" : "❌ API Key MANCANTE");

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
    await axios.post(
      `https://api.openai.com/v1/threads/${threadID}/messages`,
      {
        role: "user",
        content: `Cappello Verde: Genera idee creative e alternative. \n\nDomanda: "${domanda}"`,
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
    assistant_id: ASSISTANT_ID // ✅ Corretto!
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
      console.log("Attesa elaborazione...");
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

    console.log("Run completato, recupero risposta...");

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
    console.log("Risposta ricevuta:", risposta);
    return risposta;

  } catch (error) {
    console.error("❌ Errore API Assistant:", error.response?.data || error.message);
    throw new Error("Errore nella richiesta all'Assistant API.");
  }
}

module.exports = callAssistantAPI;
