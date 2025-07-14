var player = GetPlayer();
var domanda           = player.GetVar("DomandaUtente");
var cappelloSelezionato = player.GetVar("CappelloSelezionato");
var intenzione        = player.GetVar("IntenzioneUtente");
var sessionId         = player.GetVar("sessionUUID");

var nomeRisposta      = "Risposta" + cappelloSelezionato.charAt(0).toUpperCase() + cappelloSelezionato.slice(1);
var rispostaEsistente = player.GetVar(nomeRisposta);

// Funzioni per creare lo spinner dinamicamente
function createSpinner() {
    // Rimuovi spinner esistenti
    const existingSpinner = document.getElementById('storylineSpinner');
    if (existingSpinner) existingSpinner.remove();
    
    // Crea lo spinner (più piccolo, a sinistra, centrato)
    const spinner = document.createElement('div');
    spinner.id = 'storylineSpinner';
    spinner.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50px;
        transform: translateY(-50%);
        z-index: 9999;
        text-align: center;
        width: 80px;
    `;
    
    // Crea il cerchio (più piccolo)
    const circle = document.createElement('div');
    circle.style.cssText = `
        width: 25px;
        height: 25px;
        background: linear-gradient(45deg, #3498db, #e74c3c);
        border-radius: 50%;
        margin: 0 auto 15px auto;
        animation: spinPulse 2s ease-in-out infinite;
    `;
    
    // Crea il testo (più piccolo)
    const text = document.createElement('div');
    text.textContent = 'Analizzando...';
    text.style.cssText = `
        font-family: Arial, sans-serif;
        color: #333;
        font-size: 12px;
        animation: fadeInOut 2s ease-in-out infinite;
    `;
    
    // Aggiungi CSS per le animazioni
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spinPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.7; }
        }
        @keyframes fadeInOut {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
    `;
    
    // Assembla tutto
    spinner.appendChild(circle);
    spinner.appendChild(text);
    document.body.appendChild(style);
    document.body.appendChild(spinner);
}

function showSpinner() {
    createSpinner();
}

function hideSpinner() {
    const spinner = document.getElementById('storylineSpinner');
    if (spinner) spinner.remove();
}

// ————————————————————————————————
// 🔄 Avvia lo spinner PRIMA di qualsiasi attesa
setTimeout(() => showSpinner(), 100);  // attesa minima per DOM
// ————————————————————————————————

if (rispostaEsistente && rispostaEsistente.trim() !== "") {
  console.log("Risposta già presente per", cappelloSelezionato);

  // 🛑 Ferma immediatamente perché non serve chiamare l'API
  hideSpinner();
  
} else {
  player.SetVar(nomeRisposta, "Sto pensando…");

  fetch("https://sei-cappelli-api.onrender.com/sei-cappelli", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({
      domanda     : domanda,
      cappello    : cappelloSelezionato,
      intenzione  : intenzione,
      sessionUUID : sessionId
    })
  })
  .then(r => r.json())
  .then(data => {
    player.SetVar(nomeRisposta, data[cappelloSelezionato]);

    // ——————————————————————
    // 🛑 Ferma lo spinner quando ARRIVA la risposta
    hideSpinner();
    // ——————————————————————
  })
  .catch(err => {
    console.error("Errore nella richiesta:", err);
    player.SetVar("ErroreAPI", "Errore nella connessione all'assistente.");

    // 🛑 Ferma lo spinner anche in caso di errore
    hideSpinner();
  });
} 