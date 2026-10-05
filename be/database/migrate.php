<?php
declare(strict_types=1);

/**
 * Chạy toàn bộ migration SQL trong database/migrations theo thứ tự tên file.
 * An toàn chạy lại nhiều lần (các file đều dùng IF NOT EXISTS).
 *
 * Cách dùng:
 *   docker compose exec backend php database/migrate.php
 *   php database/migrate.php   (chạy local, cần env DB_* trỏ đúng DB)
 */

$host = getenv('DB_HOST') ?: 'postgres';
$port = getenv('DB_PORT') ?: '5432';
$db   = getenv('DB_DATABASE') ?: 'blog_db';
$user = getenv('DB_USERNAME') ?: 'blog_user';
$pass = getenv('DB_PASSWORD') ?: 'blog_secret';
$driver = getenv('DB_CONNECTION') ?: 'pgsql';

try {
    $dsn = $driver === 'mysql'
        ? "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4"
        : "pgsql:host={$host};port={$port};dbname={$db}";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    fwrite(STDERR, "Không thể kết nối CSDL: " . $e->getMessage() . PHP_EOL);
    exit(1);
}

$dir = __DIR__ . '/migrations';
$files = glob($dir . '/*.sql');
if ($files === false || $files === []) {
    fwrite(STDERR, "Không tìm thấy file migration trong {$dir}" . PHP_EOL);
    exit(1);
}
sort($files);

$failed = 0;
foreach ($files as $file) {
    $name = basename($file);
    $sql = file_get_contents($file);
    if ($sql === false || trim($sql) === '') {
        echo "[SKIP] {$name} (rỗng)" . PHP_EOL;
        continue;
    }
    try {
        $pdo->exec($sql);
        echo "[OK] {$name}" . PHP_EOL;
    } catch (PDOException $e) {
        $failed++;
        fwrite(STDERR, "[FAIL] {$name}: " . $e->getMessage() . PHP_EOL);
    }
}

// Kiểm tra nhanh schema bảng users sau migrate.
try {
    $stmt = $pdo->query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
    );
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "users columns: " . implode(', ', $cols) . PHP_EOL;
} catch (PDOException $e) {
    fwrite(STDERR, "Không đọc được schema users: " . $e->getMessage() . PHP_EOL);
}

exit($failed > 0 ? 1 : 0);
