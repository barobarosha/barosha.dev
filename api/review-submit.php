<?php
/**
 * Приём отзыва с сайта.
 *
 * 1. Сохраняет отзыв в таблицу reviews с флагом approved = 0.
 * 2. Отправляет уведомление в Telegram (номер отзыва + проект,
 *    без имени автора и без текста отзыва).
 * 3. На сайте отзыв появится после ручного одобрения
 *    (approved = 1, например через phpMyAdmin).
 */

header('Content-Type: application/json; charset=utf-8');


// ==================================================
// НАСТРОЙКИ БАЗЫ ДАННЫХ
// ==================================================

$DB_HOST = 'localhost';
$DB_NAME = 'u3620001_default';
$DB_USER = 'u3620001_default';
$DB_PASS = 'DrcGCIa0FJ89h79v';


// ==================================================
// НАСТРОЙКИ TELEGRAM
// ==================================================

$TELEGRAM_BOT_TOKEN = '8894075356:AAEg31QY9e_pECMyBMINx9A8pMcicKk2sPE';
$TELEGRAM_CHAT_ID = '152070233';


// ==================================================
// CORS
// ==================================================

$allowed_origin = 'https://baroshacode.ru';

if (
    isset($_SERVER['HTTP_ORIGIN']) &&
    in_array($_SERVER['HTTP_ORIGIN'], [$allowed_origin, 'http://localhost:8090', 'http://localhost:5173'], true)
) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}


// ==================================================
// OPTIONS / ТОЛЬКО POST
// ==================================================

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}


// ==================================================
// ДАННЫЕ ФОРМЫ
// ==================================================

$input = json_decode(file_get_contents('php://input'), true);

$name    = isset($input['name'])    ? trim($input['name'])    : '';
$project = isset($input['project']) ? trim($input['project']) : '';
$text    = isset($input['text'])    ? trim($input['text'])    : '';


// ==================================================
// ВАЛИДАЦИЯ
// ==================================================

$errors = [];

if (empty($name) || mb_strlen($name) > 255)       { $errors[] = 'name'; }
if (empty($project) || mb_strlen($project) > 255) { $errors[] = 'project'; }
if (empty($text) || mb_strlen($text) > 5000)      { $errors[] = 'text'; }

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Validation failed', 'fields' => $errors]);
    exit;
}


// ==================================================
// ПОДКЛЮЧЕНИЕ К БД
// ==================================================

try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    error_log('DB connection failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database connection failed']);
    exit;
}


// ==================================================
// СОХРАНЯЕМ ОТЗЫВ (approved = 0)
// ==================================================

try {
    $stmt = $pdo->prepare(
        "INSERT INTO reviews (name, project, text, approved)
         VALUES (:name, :project, :text, 0)"
    );
    $stmt->execute([
        ':name'    => $name,
        ':project' => $project,
        ':text'    => $text,
    ]);

    $review_id = $pdo->lastInsertId();


    // ==============================================
    // TELEGRAM-УВЕДОМЛЕНИЕ
    //
    // Имя и текст отзыва сюда НЕ передаются —
    // только номер и проект, чтобы понимать, откуда.
    // ==============================================

    if (!empty($TELEGRAM_BOT_TOKEN) && !empty($TELEGRAM_CHAT_ID)) {

        $telegram_text =
            "⭐ Новый отзыв на сайте baroshacode.ru\n\n" .
            "Номер отзыва: #" . $review_id . "\n" .
            "Проект: " . $project . "\n" .
            "Ждёт проверки: отзывы → таблица reviews → approved = 1\n" .
            "Время: " . date('d.m.Y H:i:s');

        $telegram_url = 'https://api.telegram.org/bot' . $TELEGRAM_BOT_TOKEN . '/sendMessage';

        $ch = curl_init($telegram_url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'chat_id' => $TELEGRAM_CHAT_ID,
            'text'    => $telegram_text,
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $telegram_response = curl_exec($ch);
        $telegram_http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($telegram_response === false || $telegram_http_code !== 200) {
            error_log('Telegram notification failed');
        }

        curl_close($ch);
    }


    echo json_encode([
        'ok' => true,
        'message' => 'Спасибо! Отзыв появится на сайте после проверки — обычно в течение дня.',
    ]);

} catch (PDOException $e) {
    error_log('DB insert failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to save review']);
}
?>
