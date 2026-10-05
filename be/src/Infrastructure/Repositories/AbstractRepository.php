<?php
declare(strict_types=1);

namespace src\Infrastructure\Repositories;

use src\Application\Interfaces\RepositoryInterface;
use src\Infrastructure\Context\DbContext;
use PDO;

abstract class AbstractRepository implements RepositoryInterface
{
    protected DbContext $context;
    
    // Bắt buộc lớp con phải khai báo tên bảng
    protected string $table; 

    public function __construct(DbContext $context)
    {
        $this->context = $context;
    }

    protected function db(): PDO
    {
        return $this->context->getConnection();
    }

    // Đã thêm Type Hinting: int $id và trả về void
    public function delete(int $id): void
    {
        $stmt = $this->db()->prepare("DELETE FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
    }

    // Các lớp con khi kế thừa BẮT BUỘC phải viết lại 3 hàm này với đúng kiểu dữ liệu
    abstract public function findById(int $id): ?object;
    abstract public function save(object $entity): int;
    abstract public function update(object $entity): void;
}