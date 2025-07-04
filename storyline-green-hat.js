var player = GetPlayer();
var domanda = player.GetVar("DomandaUtente");
var cappello = "verde"; // forzato
var intenzione = player.GetVar("IntenzioneUtente");
var sessionId = player.GetVar("sessionUUID"); // Recupera la sessione

// Messaggio temporaneo
player.SetVar("RispostaVerde", "Sto pensando…");

// Chiamata all'API con anche l'intenzione e la sessionUUID
fetch("https://sei-cappelli-api.onrender.com/sei-cappelli", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ 
    domanda: domanda, 
    cappello: cappello,
    intenzione: intenzione,
    sessionUUID: sessionId  // <-- aggiunto qui
  })
})
.then(response => response.json())
.then(data => {
  // Gestione del nuovo formato con multiple strategie
  if (data.verde) {
    if (Array.isArray(data.verde)) {
      // Nuovo formato: multiple strategie
      console.log("Ricevute", data.strategie_count, "strategie");
      
      // Prepara il testo combinato per la visualizzazione
      let rispostaCompleta = "";
      data.verde.forEach((strategia, index) => {
        rispostaCompleta += `=== STRATEGIA ${index + 1}: ${strategia.strategia.toUpperCase()} ===\n\n`;
        rispostaCompleta += strategia.risposta + "\n\n";
      });
      
      // Salva la risposta combinata
      player.SetVar("RispostaVerde", rispostaCompleta);
      
      // Salva anche i dati separati per uso futuro
      player.SetVar("StrategieCount", data.strategie_count);
      player.SetVar("StrategieData", JSON.stringify(data.verde));
      
      console.log("Strategie elaborate:", data.verde.length);
    } else {
      // Formato vecchio: singola risposta (fallback)
      player.SetVar("RispostaVerde", data.verde);
      player.SetVar("StrategieCount", 1);
    }
  } else {
    player.SetVar("RispostaVerde", "Nessuna risposta ricevuta.");
  }
})
.catch(error => {
  console.error("Errore nella richiesta:", error);
  player.SetVar("ErroreAPI", "Errore nella connessione all'assistente.");
}); 