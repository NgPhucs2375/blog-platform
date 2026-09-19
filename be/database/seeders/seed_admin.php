<?php
declare(strict_types=1);

/**
 * Seeder: Tạo tài khoản mặc định (Admin + User test)
 * Chạy: docker exec blog_backend php database/seeders/seed_admin.php
 *
 * Tài khoản được seed (xem thêm README.md):
 *  - Admin     : superadmin  / superadmin@gmail.com   / superadmin123@
 *  - User test : usertest    / usertest@gmail.com     / usertest123@
 *
 * Seeder idempotent: chạy lại nhiều lần không bị trùng.
 */

$host = getenv('DB_HOST') ?: 'postgres';
$port = getenv('DB_PORT') ?: '5432';
$db   = getenv('DB_DATABASE') ?: 'blog_db';
$user = getenv('DB_USERNAME') ?: 'blog_user';
$pass = getenv('DB_PASSWORD') ?: 'blog_secret';

$dsn = "pgsql:host={$host};port={$port};dbname={$db}";
$pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$accounts = [
    [
        'username' => 'superadmin',
        'email'    => 'superadmin@gmail.com',
        'password' => 'superadmin123@',
        'role'     => 'Admin',
        'status'   => 'Active',
    ],
    [
        'username' => 'usertest',
        'email'    => 'usertest@gmail.com',
        'password' => 'usertest123@',
        'role'     => 'User',
        'status'   => 'Active',
    ],
];

$insertStmt = $pdo->prepare(
    "INSERT INTO users (username, email, password_hash, role, status, created_at)
     VALUES (:username, :email, :password_hash, :role, :status, NOW())"
);

foreach ($accounts as $account) {
    // Kiểm tra đã tồn tại chưa (theo email hoặc username)
    $check = $pdo->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
    $check->execute([$account['email'], $account['username']]);
    $existing = $check->fetch();

    if ($existing) {
        echo "[bo qua] Tai khoan da ton tai voi ID: {$existing['id']}\n";
        echo "  - Username: {$account['username']} ({$account['role']})\n";
        continue;
    }

    $insertStmt->execute([
        ':username'      => $account['username'],
        ':email'         => $account['email'],
        ':password_hash' => password_hash($account['password'], PASSWORD_BCRYPT),
        ':role'          => $account['role'],
        ':status'        => $account['status'],
    ]);

    $newId = $pdo->lastInsertId('users_id_seq');
    echo "[ok] Tao tai khoan thanh cong!\n";
    echo "  - ID: {$newId}\n";
    echo "  - Username: {$account['username']}\n";
    echo "  - Email: {$account['email']}\n";
    echo "  - Password: {$account['password']}\n";
    echo "  - Role: {$account['role']}\n";
    echo "  - Status: {$account['status']}\n";
}

echo "Seed hoan tat.\n";
