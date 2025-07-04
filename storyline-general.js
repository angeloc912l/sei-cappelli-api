var player = GetPlayer();
var domanda = player.GetVar("DomandaUtente");
var cappelloSelezionato = player.GetVar("CappelloSelezionato");
var intenzione = player.GetVar("IntenzioneUtente");
var sessionId = player.GetVar("sessionUUID");  // Recupera la sessione

var nomeRisposta = "Risposta" + cappelloSelezionato.charAt(0).toUpperCase() + cappelloSelezionato.slice(1);
var rispostaEsistente = player.GetVar(nomeRisposta);

// Se la risposta esiste, non chiamiamo l'API
if (rispostaEsistente && rispostaEsistente.trim() !== "") {
  console.log("Risposta già presente per", cappelloSelezionato);
} else {
  // Messaggio temporaneo
  player.SetVar(nomeRisposta, "Sto pensando…");

  // Chiamata all'API con anche l'intenzione e la sessionUUID
  fetch("https://sei-cappelli-api.onrender.com/sei-cappelli", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ 
      domanda: domanda, 
      cappello: cappelloSelezionato,
      intenzione: intenzione,
      sessionUUID: sessionId     // <-- sessionUUID aggiunta qui
    })
  })
  .then(response => response.json())
  .then(data => {
    // Gestione speciale per il cappello verde con multiple strategie
    if (cappelloSelezionato === "verde" && Array.isArray(data.verde)) {
      // Nuovo formato: multiple strategie per il cappello verde
      console.log("Ricevute", data.strategie_count, "strategie per il cappello verde");
      
      // Prepara il testo combinato per la visualizzazione
      let rispostaCompleta = "";
      data.verde.forEach((strategia, index) => {
        rispostaCompleta += `=== STRATEGIA ${index + 1}: ${strategia.strategia.toUpperCase()} ===\n\n`;
        rispostaCompleta += strategia.risposta + "\n\n";
      });
      
      // Salva la risposta combinata
      player.SetVar(nomeRisposta, rispostaCompleta);
      
      // Salva anche i dati separati per uso futuro
      player.SetVar("StrategieCount", data.strategie_count);
      player.SetVar("StrategieData", JSON.stringify(data.verde));
      
      console.log("Strategie elaborate:", data.verde.length);
    } else {
      // Formato normale per tutti gli altri cappelli (o fallback per verde)
      player.SetVar(nomeRisposta, data[cappelloSelezionato]);
      
      // Se è verde ma non è array, salva count = 1
      if (cappelloSelezionato === "verde") {
        player.SetVar("StrategieCount", 1);
      }
    }
  })
  .catch(error => {
    console.error("Errore nella richiesta:", error);
    player.SetVar("ErroreAPI", "Errore nella connessione all'assistente.");
  });
} 