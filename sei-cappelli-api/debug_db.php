<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../mpdf_lib/vendor/autoload.php';

$host = '86.107.36.185';
$user = 'zinstruk_bianco';
$pass = 'C912l02114927_';
$dbname = 'zinstruk_cappelli';

$session_id = $_GET['sid'] ?? null;
if (!$session_id) {
    die('Session ID mancante');
}

$conn = new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) {
    die('Errore connessione DB: ' . $conn->connect_error);
}

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
$conn->close();

if ($intenzione === 'valutazione') {
    $frase = 'alla tua idea';
} elseif ($intenzione === 'generazione') {
    $frase = 'al tuo problema';
} else {
    $frase = 'alla tua idea o problema';
}

$html = '
<h1>Sei Cappelli per Pensare – Analisi e Teoria Integrata</h1>
<h2>Indice</h2>
<ol>
  <li>Introduzione</li>
  <li>La Teoria dei Sei Cappelli</li>
  <li>Analisi dei Sei Cappelli
    <ol type="a">
      <li>Cappello Bianco – Fatti e Dati</li>
      <li>Cappello Rosso – Emozioni e Intuizioni</li>
      <li>Cappello Nero – Critica e Attenzione ai Rischi</li>
      <li>Cappello Giallo – Ottimismo e Benefici</li>
      <li>Cappello Blu – Controllo e Organizzazione</li>
      <li>Cappello Verde – Creatività e Strategie</li>
    </ol>
  </li>
  <li>Strategie del Cappello Verde</li>
  <li>Prompt e Istruzioni Tecniche</li>
  <li>Invito alla Lettura e Riferimenti</li>
</ol>
<h2>1. Introduzione</h2>
<p>Questo documento presenta un\'analisi personalizzata basata sulla metodologia dei Sei Cappelli per Pensare di Edward De Bono, integrando dati specifici relativi ' . $frase . '. La parte teorica è integrata all\'interno di ogni sezione per fornire un contesto chiaro e completo.</p>
';

$mpdf = new \Mpdf\Mpdf();
$mpdf->WriteHTML($html);
$mpdf->Output();