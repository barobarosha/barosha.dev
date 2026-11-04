<?php
/**
 * Выдача одобренных отзывов (approved = 1) для сайта.
 *
 * GET api/reviews.php
 * Ответ: { "ok": true, "reviews": [ { "name": ..., "project": ..., "text": ... }, ... ] }
 *
 * Отдаёт только опубликованные отзывы; отзывы с approved = 0
 * никогда не покидают сервер.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');


// ==================================================
// НАСТРОЙКИ БАЗЫ ДАННЫХ
// ==================================================

$DB_HOST = 'localhost';
$DB_NAME = 'u3620001_default';
$DB_USER = 'u3620001_default';
$DB_PASS = 'DrcGCIa0FJ89h79v';


// ==================================================
// ТОЛЬКО GET
// ==================================================

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}


// ==================================================
// БД + ВЫБОРКА
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

    $stmt = $pdo->query(
        "SELECT name, project, text
         FROM reviews
         WHERE approved = 1
         ORDER BY id DESC"
    );

    $reviews = $stmt->fetchAll();

    echo json_encode([
        'ok' => true,
        'reviews' => $reviews,
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    error_log('reviews fetch failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database error']);
}
?>
