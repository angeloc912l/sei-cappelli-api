var player = GetPlayer();
var domanda           = player.GetVar("DomandaUtente");
var cappelloSelezionato = player.GetVar("CappelloSelezionato");
var intenzione        = player.GetVar("IntenzioneUtente");
var sessionId         = player.GetVar("sessionUUID");

var nomeRisposta      = "Risposta" + cappelloSelezionato.charAt(0).toUpperCase() + cappelloSelezionato.slice(1);
var rispostaEsistente = player.GetVar(nomeRisposta);

var spinnerTimeoutId = null;

// Funzione per aggiungere il CSS delle animazioni UNA SOLA VOLTA
function ensureSpinnerCSS() {
    if (!document.getElementById('storylineSpinnerCSS')) {
        const style = document.createElement('style');
        style.id = 'storylineSpinnerCSS';
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
        document.head.appendChild(style);
    }
}

// Funzione per creare lo spinner dinamicamente, leggermente a sinistra del centro
function createSpinner() {
    // Rimuovi spinner esistenti
    const existingSpinner = document.getElementById('storylineSpinner');
    if (existingSpinner) existingSpinner.remove();

    ensureSpinnerCSS();

    // Spinner leggermente a sinistra del centro (es: 60% della larghezza)
    const spinner = document.createElement('div');
    spinner.id = 'storylineSpinner';
    spinner.style.cssText = `
        position: absolute;
        top: 50%;
        left: 60%;
        transform: translate(-50%, -50%);
        z-index: 9999;
        text-align: center;
        width: 320px;
        max-width: 90vw;
        min-width: 180px;
        pointer-events: none;
        box-sizing: border-box;
    `;

    // Cerchio
    const circle = document.createElement('div');
    circle.style.cssText = `
        width: 25px;
        height: 25px;
        background: linear-gradient(45deg, #3498db, #e74c3c);
        border-radius: 50%;
        margin: 0 auto 15px auto;
        animation: spinPulse 2s ease-in-out infinite;
    `;

    // Testo su un solo rigo, centrato
    const text = document.createElement('div');
    text.textContent = 'Risposta in elaborazione da parte dell’AI...';
    text.style.cssText = `
        font-family: Arial, sans-serif;
        color: #fff;
        font-size: 15px;
        animation: fadeInOut 2s ease-in-out infinite;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    `;

    spinner.appendChild(circle);
    spinner.appendChild(text);

    // Inserisci nello slide layer attivo
    const layerContainer = document.querySelector('.slide-object.slide-object-objgroup.shown');
    if (layerContainer) {
        layerContainer.appendChild(spinner);
    } else {
        document.body.appendChild(spinner); // fallback
    }
}

function showSpinner() {
    createSpinner();
}

function hideSpinner() {
    // Cancella eventuale timeout pendente
    if (spinnerTimeoutId !== null) {
        clearTimeout(spinnerTimeoutId);
        spinnerTimeoutId = null;
    }
    const spinner = document.getElementById('storylineSpinner');
    if (spinner) spinner.remove();
}

// ————————————————————————————————
// 🔄 Avvia lo spinner PRIMA di qualsiasi attesa SOLO SE la risposta NON esiste
if (!rispostaEsistente || rispostaEsistente.trim() === "") {
    spinnerTimeoutId = setTimeout(() => {
        showSpinner();
        spinnerTimeoutId = null;
    }, 100);  // attesa minima per DOM
}
// ————————————————————————————————

if (rispostaEsistente && rispostaEsistente.trim() !== "") {
    console.log("Risposta già presente per", cappelloSelezionato);

    // 🛑 Ferma immediatamente perché non serve chiamare l'API
    hideSpinner();

} else {
    // player.SetVar(nomeRisposta, "Sto pensando…"); // <-- RIMOSSA QUESTA RIGA

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