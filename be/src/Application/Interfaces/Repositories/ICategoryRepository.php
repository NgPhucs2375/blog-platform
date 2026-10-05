<?php
declare(strict_types=1);

namespace src\Application\Interfaces\Repositories;

use src\Application\Interfaces\RepositoryInterface;
use src\Domain\Entities\Category;

/**
 * @extends RepositoryInterface<Category>
 */
interface ICategoryRepository extends RepositoryInterface
{
    // Áp dụng Covariance: Ghi đè kiểu trả về thành Category cụ thể thay vì object
    public function findById(int $id): ?Category;
    public function findBySlug(string $slug): ?Category;
    public function findByName(string $name): ?Category;
    
    /** @return Category[] */
    public function getAllCategories(): array;
    public function hasPosts(int $categoryId): bool;
    
    /** @param int[] $orderedIds */
    public function updateSortOrders(array $orderedIds): void;
}