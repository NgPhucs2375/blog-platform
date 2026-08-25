<?php
declare(strict_types=1);

namespace src\Application\Interfaces\Repositories;

use src\Domain\Entities\SystemLog;
use src\Domain\Enums\LogAction;

/**
 * Khối lưu trữ Append-Only (Chỉ đọc và ghi thêm)
 */
interface ISystemLogRepository
{
    public function save(SystemLog $log): void;
    
    /** @return SystemLog[] */
    public function getLogs(
        ?int $userId = null, 
        ?LogAction $action = null, 
        ?string $targetType = null, 
        ?string $startDate = null, 
        ?string $endDate = null, 
        int $page = 1, 
        int $limit = 20
    ): array;
    
    public function countLogs(): int;
}