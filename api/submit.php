<?php
/**
 * Обработчик формы обратной связи
 *
 * 1. Сохраняет полную заявку в MySQL на хостинге REG.RU.
 * 2. Отправляет в Telegram только уведомление о новой заявке.
 *    Персональные данные в Telegram НЕ передаются.
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

// Токен Telegram-бота.
// Вставь настоящий токен между кавычками.
$TELEGRAM_BOT_TOKEN = '8894075356:AAEg31QY9e_pECMyBMINx9A8pMcicKk2sPE';

// Твой Telegram Chat ID.
// Вставь число между кавычками.
$TELEGRAM_CHAT_ID = '152070233';


// ==================================================
// CORS
// ==================================================

$allowed_origin = 'https://baroshacode.ru';

if (
    isset($_SERVER['HTTP_ORIGIN']) &&
    $_SERVER['HTTP_ORIGIN'] === $allowed_origin
) {
    header("Access-Control-Allow-Origin: $allowed_origin");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}


// ==================================================
// ОБРАБОТКА OPTIONS
// ==================================================

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


// ==================================================
// РАЗРЕШАЕМ ТОЛЬКО POST
// ==================================================

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'ok' => false,
        'error' => 'Method not allowed'
    ]);

    exit;
}


// ==================================================
// ПОЛУЧАЕМ ДАННЫЕ ИЗ ФОРМЫ
// ==================================================

$input = json_decode(
    file_get_contents('php://input'),
    true
);

$name = isset($input['name'])
    ? trim($input['name'])
    : '';

$contact = isset($input['contact'])
    ? trim($input['contact'])
    : '';

$message = isset($input['message'])
    ? trim($input['message'])
    : '';


// ==================================================
// ВАЛИДАЦИЯ
// ==================================================

$errors = [];

if (empty($name) || mb_strlen($name) > 255) {
    $errors[] = 'name';
}

if (empty($contact) || mb_strlen($contact) > 255) {
    $errors[] = 'contact';
}

if (empty($message) || mb_strlen($message) > 5000) {
    $errors[] = 'message';
}

if (!empty($errors)) {
    http_response_code(400);

    echo json_encode([
        'ok' => false,
        'error' => 'Validation failed',
        'fields' => $errors
    ]);

    exit;
}


// ==================================================
// ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ
// ==================================================

try {

    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE =>
                PDO::ERRMODE_EXCEPTION,

            PDO::ATTR_DEFAULT_FETCH_MODE =>
                PDO::FETCH_ASSOC,

            PDO::ATTR_EMULATE_PREPARES =>
                false,
        ]
    );

} catch (PDOException $e) {

    error_log(
        'DB connection failed: ' .
        $e->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        'ok' => false,
        'error' => 'Database connection failed'
    ]);

    exit;
}


// ==================================================
// СОХРАНЯЕМ ЗАЯВКУ В MYSQL
// ==================================================

try {

    $stmt = $pdo->prepare(
        "INSERT INTO submissions
        (name, contact, message)
        VALUES
        (:name, :contact, :message)"
    );

    $stmt->execute([
        ':name' => $name,
        ':contact' => $contact,
        ':message' => $message,
    ]);


    // ==============================================
    // ПОЛУЧАЕМ ID НОВОЙ ЗАЯВКИ
    // ==============================================

    $submission_id = $pdo->lastInsertId();


    // ==============================================
    // TELEGRAM-УВЕДОМЛЕНИЕ
    //
    // ВАЖНО:
    // Имя, контакт и текст сообщения сюда НЕ передаются.
    // ==============================================

    if (
        !empty($TELEGRAM_BOT_TOKEN) &&
        !empty($TELEGRAM_CHAT_ID)
    ) {

        $telegram_text =
            "🔔 Новая заявка с сайта baroshacode.ru\n\n" .
            "Номер заявки: #" . $submission_id . "\n" .
            "Время: " . date('d.m.Y H:i:s');

        $telegram_url =
            'https://api.telegram.org/bot' .
            $TELEGRAM_BOT_TOKEN .
            '/sendMessage';

        $telegram_data = [
            'chat_id' => $TELEGRAM_CHAT_ID,
            'text' => $telegram_text,
        ];


        // Отправляем уведомление через cURL.
        // Если Telegram временно недоступен,
        // заявка всё равно уже сохранена в базе.

        $ch = curl_init($telegram_url);

        curl_setopt(
            $ch,
            CURLOPT_POST,
            true
        );

        curl_setopt(
            $ch,
            CURLOPT_POSTFIELDS,
            http_build_query($telegram_data)
        );

        curl_setopt(
            $ch,
            CURLOPT_RETURNTRANSFER,
            true
        );

        curl_setopt(
            $ch,
            CURLOPT_TIMEOUT,
            10
        );

        $telegram_response =
            curl_exec($ch);

        $telegram_http_code =
            curl_getinfo(
                $ch,
                CURLINFO_HTTP_CODE
            );

        if (
            $telegram_response === false ||
            $telegram_http_code !== 200
        ) {

            error_log(
                'Telegram notification failed'
            );
        }

        curl_close($ch);
    }


    // ==============================================
    // УСПЕШНЫЙ ОТВЕТ САЙТУ
    // ==============================================

    echo json_encode([
        'ok' => true,
        'message' =>
            'Заявка отправлена. Свяжусь с вами в течение дня!',
    ]);

} catch (PDOException $e) {

    error_log(
        'DB insert failed: ' .
        $e->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        'ok' => false,
        'error' => 'Failed to save submission'
    ]);
}
?>
