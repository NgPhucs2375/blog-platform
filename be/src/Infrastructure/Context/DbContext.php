<?php
declare(strict_types=1);

namespace src\Infrastructure\Context;

use PDO;
use PDOException;
use RuntimeException;

class DbContext
{
    private PDO $connection;

    public function __construct()
    {
        // ==========================================
        // 🔄 CƠ CHẾ SWITCH DATABASE NHANH CHO TEAM
        // ==========================================
        // Khi nào muốn dùng MySQL thì mở comment dòng dưới và đóng dòng Postgres lại:
        // $driver = 'mysql'; 
        
        $driver = getenv('DB_CONNECTION') ?: 'pgsql'; 
        // ==========================================

        $host = getenv('DB_HOST') ?: 'localhost';
        $port = getenv('DB_PORT') ?: '5432'; // Sửa thành 3306 nếu test MySQL ngoài Docker
        $db   = getenv('DB_DATABASE') ?: 'blog_db';
        $user = getenv('DB_USERNAME') ?: 'blog_user';
        $pass = getenv('DB_PASSWORD') ?: 'blog_secret';

        try {
            if ($driver === 'pgsql') {
                $dsn = "pgsql:host={$host};port={$port};dbname={$db}";
            } elseif ($driver === 'mysql') {
                $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
            } else {
                throw new RuntimeException("Trình điều khiển DB không hợp lệ: " . $driver);
            }

            $this->connection = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // Bắn Exception ngay khi có lỗi SQL
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Luôn trả về mảng thay vì object stdClass
                PDO::ATTR_EMULATE_PREPARES => false, // Ép PDO trả về đúng kiểu int/bool thay vì string cho mọi cột
            ]);
            
        } catch (PDOException $e) {
            throw new RuntimeException("Không thể kết nối CSDL: " . $e->getMessage());
        }
    }

    public function getConnection(): PDO 
    { 
        return $this->connection; 
    }

    public function beginTransaction(): bool 
    { 
        return $this->connection->beginTransaction(); 
    }

    public function commit(): bool 
    { 
        return $this->connection->commit(); 
    }

    public function rollBack(): bool 
    { 
        return $this->connection->rollBack(); 
    }

    public function lastInsertId(?string $name = null): string|false 
    { 
        // Lưu ý: PostgreSQL thường cần tên sequence (vd: 'users_id_seq') để lấy ID cuối
        return $this->connection->lastInsertId($name); 
    }
}