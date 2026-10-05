<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';
Dotenv\Dotenv::createImmutable(dirname(__DIR__))->safeLoad();

$name = $_ENV['DB_DATABASE'] ?? 'blog_platform_laravel';
if (! preg_match('/\A[a-zA-Z0-9_]+\z/', $name)) {
    fwrite(STDERR, "DB_DATABASE chỉ được chứa chữ, số và dấu gạch dưới.\n");
    exit(1);
}

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port = $_ENV['DB_PORT'] ?? '3306';
$username = $_ENV['DB_USERNAME'] ?? 'root';
$password = $_ENV['DB_PASSWORD'] ?? '';

try {
    $pdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $username, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    fwrite(STDOUT, "Database {$name} sẵn sàng.\n");
} catch (PDOException $exception) {
    fwrite(STDERR, "Không tạo được database: {$exception->getMessage()}\n");
    exit(1);
}
