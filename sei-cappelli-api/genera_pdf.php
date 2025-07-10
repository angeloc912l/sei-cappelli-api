<?php
// DEBUG: Configurazione completa
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

require_once __DIR__ . '/../mpdf_lib/vendor/autoload.php';

// --- CONFIGURAZIONE DATABASE ---
$host = getenv('DB_HOST') ?: '86.107.36.185';
$user = getenv('DB_USER') ?: 'zinstruk_bianco';
$pass = getenv('DB_PASS') ?: 'C912l02114927_';
$dbname = getenv('DB_NAME') ?: 'zinstruk_cappelli';

// --- RECUPERO SESSIONE ---
$session_id = $_GET['sid'] ?? null;
if (!$session_id) {
    die('Session ID mancante');
}

// --- CONNESSIONE ---
$conn = new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) {
    die('Errore connessione DB: ' . $conn->connect_error);
}

// --- QUERY: recupera l'intenzione per la sessione ---
$sql = "SELECT intenzione FROM interazioni_cappelli WHERE session_uuid = ? LIMIT 1";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    die('Errore prepare: ' . $conn->error);
}
$stmt->bind_param('s', $session_id);
$stmt->execute();
$stmt->bind_result($intenzione);
if (!$stmt->fetch()) {
    $intenzione = null;
}
$stmt->close();

// --- FUNZIONE PER RECUPERARE DATI CAPPELLO ---
function getCappelloData($conn, $session_id, $cappello, $intenzione) {
    if ($cappello === 'verde') {
        // Per il cappello verde, recupera tutte le strategie
        $sql = "SELECT strategia, risposta_json, risposta_testo FROM interazioni_cappelli WHERE session_uuid = ? AND cappello = ? AND intenzione = ? ORDER BY timestamp ASC";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            return null;
        }
        $stmt->bind_param('sss', $session_id, $cappello, $intenzione);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $strategie_data = [];
        while ($row = $result->fetch_assoc()) {
            $strategie_data[$row['strategia']] = [
                'json' => json_decode($row['risposta_json'], true),
                'testo' => $row['risposta_testo']
            ];
        }
        $stmt->close();
        return $strategie_data;
    } else {
        // Per gli altri cappelli, comportamento normale
        $sql = "SELECT risposta_json FROM interazioni_cappelli WHERE session_uuid = ? AND cappello = ? AND intenzione = ? LIMIT 1";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            return null;
        }
        $stmt->bind_param('sss', $session_id, $cappello, $intenzione);
        $stmt->execute();
        $stmt->bind_result($risposta_json);
        if ($stmt->fetch()) {
            $stmt->close();
            return json_decode($risposta_json, true);
        }
        $stmt->close();
        return null;
    }
}

// --- RECUPERO DATI PER OGNI CAPPELLO ---
$cappelli_data = [];
$cappelli = ['bianco', 'rosso', 'nero', 'giallo', 'verde', 'blu'];

foreach ($cappelli as $cappello) {
    $cappelli_data[$cappello] = getCappelloData($conn, $session_id, $cappello, $intenzione);
}

$conn->close();

// --- LOGICA DINAMICA ---
if ($intenzione === 'valutazione') {
    $frase = 'alla tua idea';
} elseif ($intenzione === 'generazione') {
    $frase = 'al tuo problema';
} else {
    $frase = 'alla tua idea o problema';
}

// --- FUNZIONE PER GENERARE LISTA DATI ---
function generateDataList($data, $field_name) {
    if (!$data || !isset($data[$field_name]) || !is_array($data[$field_name])) {
        return '<p>Nessun dato disponibile.</p>';
    }
    
    $html = '';
    foreach ($data[$field_name] as $index => $item) {
        $html .= '<li style="margin-bottom: 1em;">' . htmlspecialchars($item) . '</li>';
    }
    return '<ul>' . $html . '</ul>';
}

// --- FUNZIONE PER GENERARE LISTA IDEE CAPPELLO VERDE ---
function generateVerdeIdeas($data) {
    if (!$data || empty($data)) {
        return '<p>Nessun dato disponibile.</p>';
    }
    
    $html = '';
    $ordine_strategie = ['ventaglio', 'entrata_casuale', 'provocazione_intelligente'];
    $nomi_strategie = [
        'ventaglio' => 'Strategia del Ventaglio',
        'entrata_casuale' => 'Strategia dell\'Entrata Casuale', 
        'provocazione_intelligente' => 'Strategia della Provocazione Intelligente'
    ];
    
    foreach ($ordine_strategie as $strategia) {
        if (isset($data[$strategia]) && isset($data[$strategia]['testo']) && !empty($data[$strategia]['testo'])) {
            $html .= '<li style="margin-bottom: 1em;"><strong>' . $nomi_strategie[$strategia] . ':</strong> ' . htmlspecialchars($data[$strategia]['testo']) . '</li>';
        }
    }
    
    if (empty($html)) {
        return '<p>Nessuna idea disponibile.</p>';
    }
    
    return '<ul>' . $html . '</ul>';
}

// Contenuto PDF
$html = '
<style>
  body { font-family: DejaVu Sans, Arial, Helvetica, sans-serif; font-size: 12.5pt; color: #222; background: #f4f7fa; }
  .cover-title-center {
    color: #fff;
    font-size: 2.2em;
    text-align: center;
    background: #2563c9;
    padding: 0.8em 0.5em;
    border-radius: 32px;
    width: 90%;
    margin: 0 auto;
    letter-spacing: -1px;
    font-weight: bold;
    display: block;
  }
  h2 { color: #2563c9; font-size: 1.5em; margin-top: 1.2em; margin-bottom: 0.5em; font-weight: bold; letter-spacing: -0.5px; }
  h3 { color: #1a1a1a; font-size: 1.1em; margin-top: 1em; margin-bottom: 0.4em; font-weight: bold; }
  ul { margin-bottom: 1.2em; }
  ul li { margin-bottom: 0.7em; line-height: 1.5; }
  #indice ul, #indice ul ul { list-style-type: none; padding-left: 0; }
  #indice li { margin-bottom: 0.2em; }
  #indice a { color: #2563c9; text-decoration: none; font-weight: bold; }
  #indice a:hover { text-decoration: underline; }
  p { margin-bottom: 0.8em; }
  .theory-box { background: #eaf1fb; border-left: 6px solid #2563c9; border-radius: 12px; padding: 1.1em 1.3em; margin-bottom: 1em; color: #1a1a1a; }
  .analisi-box { background: #fff; border: 2px solid #2563c9; border-radius: 12px; padding: 1.2em; margin-bottom: 2em; box-sizing: border-box; width: 100%; max-width: 100%; color: #222; }
  .summary-box { background: #fff; border: 2px solid #2563c9; border-radius: 16px; padding: 1.5em; margin: 2em 0; box-sizing: border-box; width: 100%; max-width: 100%; font-size: 1.1em; color: #222; }
  .rounded-box { background: #2563c9; color: #fff; border-radius: 16px; padding: 1.2em; margin: 2em 0; font-size: 1.1em; width: 100%; max-width: 100%; text-align: center; font-weight: bold; }
  .section-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5em; }
  .section-table th, .section-table td { border: 1px solid #2563c9; padding: 0.5em 0.8em; }
  .section-table th { background: #2563c9; color: #fff; font-weight: bold; }
  .section-table td { background: #fff; color: #222; }
  .btn { display: inline-block; background: #2563c9; color: #fff; border-radius: 30px; padding: 0.5em 1.5em; font-size: 1.1em; font-weight: bold; border: none; margin: 1em 0; }
</style>

<!-- COPERTINA SOLO TITOLO CENTRATO ORIZZONTALMENTE -->
<div class="cover-title-center">Six thinking hats<br>AI Generator</div>
<pagebreak />

<!-- SECONDA PAGINA: solo indice, senza box descrittivi o riassuntivi -->
<h2 id="indice">Indice</h2>
<table class="section-table">
  <tr><th>Sezione</th><th>Pagina</th></tr>
  <tr><td><a href="#introduzione">1. Introduzione</a></td><td></td></tr>
  <tr><td><a href="#teoria">2. La Teoria dei Sei Cappelli</a></td><td></td></tr>
  <tr><td><a href="#analisi">3. Analisi dei Sei Cappelli</a></td><td></td></tr>
  <tr><td style="padding-left:2em;"><a href="#bianco">3.1 Cappello Bianco</a></td><td></td></tr>
  <tr><td style="padding-left:2em;"><a href="#rosso">3.2 Cappello Rosso</a></td><td></td></tr>
  <tr><td style="padding-left:2em;"><a href="#nero">3.3 Cappello Nero</a></td><td></td></tr>
  <tr><td style="padding-left:2em;"><a href="#giallo">3.4 Cappello Giallo</a></td><td></td></tr>
  <tr><td style="padding-left:2em;"><a href="#blu">3.5 Cappello Blu</a></td><td></td></tr>
  <tr><td style="padding-left:2em;"><a href="#verde">3.6 Cappello Verde</a></td><td></td></tr>
  <tr><td><a href="#strategie">4. Strategie del Cappello Verde</a></td><td></td></tr>
  <tr><td><a href="#prompt">5. Prompt e Istruzioni Tecniche</a></td><td></td></tr>
  <tr><td><a href="#riferimenti">6. Invito alla Lettura e Riferimenti</a></td><td></td></tr>
</table>

<a name="introduzione"></a><h2 id="introduzione">1. Introduzione</h2>
<p>Grazie per aver utilizzato questo modulo interattivo basato sulla metodologia dei Sei Cappelli per Pensare di Edward De Bono.<br><br>
Questo documento contiene un’analisi personalizzata generata attraverso l’uso di Intelligenza Artificiale (OpenAI Assistant API) per simulare il funzionamento di ciascun cappello, con l’obiettivo di stimolare una riflessione completa, sistematica e creativa.<br><br>
La tecnica dei Sei Cappelli offre un approccio strutturato per affrontare problemi e decisioni in modo più efficace, permettendo di osservare una questione da molteplici prospettive. La parte teorica è integrata all’interno di ogni sezione per fornire un contesto chiaro e completo.</p>

<pagebreak />
<a name="teoria"></a><h2 id="teoria">2. La Teoria dei Sei Cappelli</h2>
<p><em>«A volte il pensiero logico non basta. Serve uno sguardo nuovo.» — Edward De Bono</em></p>
<p>Edward De Bono, pioniere del pensiero laterale, ha proposto un metodo semplice ma potente per affrontare problemi e prendere decisioni in modo più completo: i Sei Cappelli per Pensare.<br><br>
Il pensiero laterale, a differenza del pensiero logico e sequenziale (che De Bono chiama pensiero verticale), ci invita a spostare il punto di vista e guardare il problema da angolazioni nuove e inaspettate. Per farlo, ha ideato la tecnica dei Sei Cappelli, un metodo metaforico che ci fa "indossare" diversi modi di pensare.<br><br>
Ogni cappello rappresenta un ruolo mentale preciso, permettendo di analizzare un problema da una prospettiva diversa. Questo approccio funziona bene sia in gruppo, dove si possono seguire sequenze guidate o lavorare in contemporanea con lo stesso cappello, sia da soli, scegliendo liberamente l’ordine.<br><br>
Il nostro cervello tende ad abituarsi a schemi abituali e automatici. La tecnica dei Sei Cappelli spezza questi automatismi, separando le fasi del pensiero e permettendo di rimescolare fatti, emozioni, critiche e idee fino a far emergere la soluzione migliore.<br><br>
In particolare, questa metodologia è molto efficace come strumento di problem solving: consente di affrontare problemi complessi in modo strutturato, analizzandoli da molteplici punti di vista e favorendo la generazione di soluzioni creative ed equilibrate. Usando i Sei Cappelli, possiamo evitare i limiti del pensiero unilaterale e stimolare nuove intuizioni, facilitando così il processo di risoluzione dei problemi.</p>

<a name="analisi"></a><h2 id="analisi">3. Analisi dei Sei Cappelli</h2>
<p>Questa analisi è stata realizzata tramite l’Intelligenza Artificiale, che ha simulato il pensiero di ciascun cappello secondo la metodologia di De Bono.<br><br>
Per ogni cappello, sono state generate risposte specifiche in base ai dati forniti dall’utente, seguendo le prospettive logica, emozionale, critica, ottimistica, creativa e organizzativa.<br><br>
L’obiettivo è offrire una panoramica completa e strutturata, utile per riflettere e trovare soluzioni innovative.</p>

<!-- CAPPELLO BIANCO -->
<pagebreak />
<div style="page-break-inside: avoid;">
<a name="bianco"></a><h3 id="bianco">3.1 Cappello Bianco – Fatti e Dati</h3>
<div class="theory-box"><strong>Teoria:</strong><br>
  Il cappello bianco si concentra su dati oggettivi e fatti verificabili, senza interpretazioni o giudizi.
</div>
<div class="analisi-box">
  <strong>Analisi personalizzata:</strong>
  ' . generateDataList($cappelli_data['bianco'], 'fatti_oggettivi') . '
</div>
</div>

<!-- CAPPELLO ROSSO -->
<pagebreak />
<div style="page-break-inside: avoid;">
<a name="rosso"></a><h3 id="rosso">3.2 Cappello Rosso – Emozioni e Intuizioni</h3>
<div class="theory-box"><strong>Teoria:</strong><br>
  Il cappello rosso permette di esprimere sentimenti, intuizioni e reazioni emotive senza giustificazioni.
</div>
<div class="analisi-box">
  <strong>Analisi personalizzata:</strong>
  ' . generateDataList($cappelli_data['rosso'], 'sentimenti_intuizioni') . '
</div>
</div>

<!-- CAPPELLO NERO -->
<pagebreak />
<div style="page-break-inside: avoid;">
<a name="nero"></a><h3 id="nero">3.3 Cappello Nero – Critica e Attenzione ai Rischi</h3>
<div class="theory-box"><strong>Teoria:</strong><br>
  Il cappello nero evidenzia i problemi, i rischi e gli aspetti negativi di una situazione.
</div>
<div class="analisi-box">
  <strong>Analisi personalizzata:</strong>
  ' . generateDataList($cappelli_data['nero'], 'valutazioni_negative') . '
</div>
</div>

<!-- CAPPELLO GIALLO -->
<pagebreak />
<div style="page-break-inside: avoid;">
<a name="giallo"></a><h3 id="giallo">3.4 Cappello Giallo – Ottimismo e Benefici</h3>
<div class="theory-box"><strong>Teoria:</strong><br>
  Il cappello giallo si concentra sui benefici, le opportunità e gli aspetti positivi.
</div>
<div class="analisi-box">
  <strong>Analisi personalizzata:</strong>
  ' . generateDataList($cappelli_data['giallo'], 'valutazioni_positive') . '
</div>
</div>

<!-- CAPPELLO BLU -->
<pagebreak />
<div style="page-break-inside: avoid;">
<a name="blu"></a><h3 id="blu">3.5 Cappello Blu – Controllo e Organizzazione</h3>
<div class="theory-box"><strong>Teoria:</strong><br>
  Il cappello blu gestisce il processo di pensiero, organizza e sintetizza le informazioni.
</div>
<div class="analisi-box">
  <strong>Analisi personalizzata:</strong>
  ' . generateDataList($cappelli_data['blu'], 'sintesi') . '
</div>
</div>

<!-- CAPPELLO VERDE -->
<pagebreak />
<div style="page-break-inside: avoid;">
<a name="verde"></a><h3 id="verde">3.6 Cappello Verde – Creatività e Strategie</h3>
<div class="theory-box"><strong>Teoria:</strong><br>
  Il cappello verde genera nuove idee, soluzioni creative e approcci alternativi attraverso diverse strategie creative.
</div>
<div class="analisi-box">
  <strong>Analisi personalizzata:</strong>
  ' . generateVerdeIdeas($cappelli_data['verde']) . '
</div>
</div>

<a name="strategie"></a><h2 id="strategie">4. Strategie del Cappello Verde</h2>
<ul>
  <li>Ventaglio di concetti</li>
  <li>Entrata casuale</li>
  <li>Provocazione intelligente</li>
  <li>Metodo della fuga</li>
</ul>

<a name="prompt"></a><h2 id="prompt">5. Prompt e Istruzioni Tecniche</h2>
<p>Questo documento è stato generato utilizzando assistenti AI specializzati che simulano il pensiero dei Sei Cappelli di De Bono, integrando dati reali e analisi personalizzate.</p>

<a name="riferimenti"></a><h2 id="riferimenti">6. Invito alla Lettura e Riferimenti</h2>
<p>Per approfondire la metodologia dei Sei Cappelli per Pensare, si consiglia la lettura delle opere di Edward De Bono, in particolare "Six Thinking Hats" e "Lateral Thinking".</p>
';

$mpdf = new \Mpdf\Mpdf([
    'mode' => 'utf-8',
    'format' => 'A4',
    'margin_left' => 15,
    'margin_right' => 15,
    'margin_top' => 16,
    'margin_bottom' => 16,
    'margin_header' => 9,
    'margin_footer' => 9,
]);
$mpdf->SetFooter('Pagina {PAGENO} di {nbpg}');
$mpdf->SetHeader('Sei Cappelli per Pensare||{DATE j/m/Y H:i}');
$mpdf->WriteHTML($html);
$mpdf->Output();