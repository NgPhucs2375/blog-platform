<?php
declare(strict_types=1);

/**
 * Seeder: Tạo tài khoản Admin đầu tiên
 * Chạy: docker exec blog_backend php database/seeders/seed_admin.php
 */

$host = getenv('DB_HOST') ?: 'postgres';
$port = getenv('DB_PORT') ?: '5432';
$db   = getenv('DB_DATABASE') ?: 'blog_db';
$user = getenv('DB_USERNAME') ?: 'blog_user';
$pass = getenv('DB_PASSWORD') ?: 'blog_secret';

$dsn = "pgsql:host={$host};port={$port};dbname={$db}";
$pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$adminData = [
    'username' => 'superadmin',
    'email'    => 'superadmin@gmail.com',
    'password' => 'superadmin123@',
    'role'     => 'Admin',
    'status'   => 'Active',
];

// Kiểm tra đã tồn tại chưa
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
$stmt->execute([$adminData['email'], $adminData['username']]);
$existing = $stmt->fetch();

if ($existing) {
    echo "Tai khoan da ton tai voi ID: {$existing['id']}\n";
    echo "  - Username: {$adminData['username']}\n";
    echo "  - Email: {$adminData['email']}\n";
    echo "  - Role: Admin\n";
    exit(0);
}

// Tạo admin
$passwordHash = password_hash($adminData['password'], PASSWORD_BCRYPT);

$stmt = $pdo->prepare(
    "INSERT INTO users (username, email, password_hash, role, status, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())"
);
$stmt->execute([
    $adminData['username'],
    $adminData['email'],
    $passwordHash,
    $adminData['role'],
    $adminData['status'],
]);

$newId = $pdo->lastInsertId('users_id_seq');

echo "Tao tai khoan Admin thanh cong!\n";
echo "  - ID: {$newId}\n";
echo "  - Username: {$adminData['username']}\n";
echo "  - Email: {$adminData['email']}\n";
echo "  - Password: {$adminData['password']}\n";
echo "  - Role: Admin\n";
echo "  - Status: Active\n";
