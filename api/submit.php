<?php
/**
 * Обработчик формы обратной связи
 * Сохраняет заявку в MySQL на REG.RU
 */

header('Content-Type: application/json; charset=utf-8');

// === НАСТРОЙКИ БАЗЫ ДАННЫХ ===
// Замени эти значения на реальные из ispmanager / письма от REG.RU
$DB_HOST = 'localhost';
$DB_NAME = 'u3620001_default';      // имя базы данных
$DB_USER = 'u3620001_default';     // имя пользователя БД
$DB_PASS = 'DrcGCIa0FJ89h79v';       

// === CORS: разрешаем запросы только с твоего домена ===
$allowed_origin = 'https://baroshacode.ru';
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $allowed_origin) {
    header("Access-Control-Allow-Origin: $allowed_origin");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// === Обработка preflight OPTIONS ===
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// === Только POST ===
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// === Получаем данные ===
$input = json_decode(file_get_contents('php://input'), true);

$name    = isset($input['name'])    ? trim($input['name'])    : '';
$contact = isset($input['contact']) ? trim($input['contact']) : '';
$message = isset($input['message']) ? trim($input['message']) : '';

// === Валидация ===
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
    echo json_encode(['ok' => false, 'error' => 'Validation failed', 'fields' => $errors]);
    exit;
}

// === Подключение к БД ===
try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    error_log('DB connection failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database connection failed']);
    exit;
}

// === Сохраняем заявку ===
try {
    $stmt = $pdo->prepare("INSERT INTO submissions (name, contact, message) VALUES (:name, :contact, :message)");
    $stmt->execute([
        ':name'    => $name,
        ':contact' => $contact,
        ':message' => $message,
    ]);

    echo json_encode([
        'ok'      => true,
        'message' => 'Заявка сохранена. Свяжусь с вами в течение дня!',
    ]);
} catch (PDOException $e) {
    error_log('DB insert failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to save submission']);
}
