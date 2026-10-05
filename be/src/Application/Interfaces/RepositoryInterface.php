<?php
declare(strict_types=1);

namespace src\Application\Interfaces;

/**
 * Giao diện gốc sử dụng Generic Template để định kiểu tĩnh cho IDE
 * @template T of object
 */
interface RepositoryInterface
{
    public function findById(int $id): ?object;
    
    /** @param T $entity */
    public function save(object $entity): int;
    
    /** @param T $entity */
    public function update(object $entity): void;
    
    public function delete(int $id): void;
}