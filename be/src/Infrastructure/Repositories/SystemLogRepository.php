<?php
declare(strict_types=1);

namespace src\Infrastructure\Repositories;

use src\Application\Interfaces\Repositories\ISystemLogRepository;
use src\Domain\Entities\SystemLog;
use src\Domain\Enums\LogAction;
use src\Domain\Enums\LogTargetType;
use src\Infrastructure\Context\DbContext;
use DateTimeImmutable;
use PDO;

class SystemLogRepository implements ISystemLogRepository
{
    private DbContext $context;
    private string $table = 'system_logs';

    public function __construct(DbContext $context)
    {
        $this->context = $context;
    }

    public function save(SystemLog $log): void
    {
        $sql = "INSERT INTO {$this->table} (user_id, action, target_type, target_id, old_value, new_value, created_at)
                VALUES (:user_id, :action, :target_type, :target_id, :old_value, :new_value, :created_at)";

        $stmt = $this->context->getConnection()->prepare($sql);
        
        // Encode mảng thành chuỗi JSON chuẩn trước khi đưa vào CSDL
        $stmt->execute([
            ':user_id' => $log->getUserId(),
            ':action' => $log->getAction()->value,
            ':target_type' => $log->getTargetType()->value,
            ':target_id' => $log->getTargetId(),
            ':old_value' => $log->getOldValue() !== null ? json_encode($log->getOldValue(), JSON_UNESCAPED_UNICODE) : null,
            ':new_value' => $log->getNewValue() !== null ? json_encode($log->getNewValue(), JSON_UNESCAPED_UNICODE) : null,
            ':created_at' => $log->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * @return SystemLog[]
     */
    public function getLogs(
        ?int $userId = null, 
        ?LogAction $action = null, 
        ?LogTargetType $targetType = null, 
        ?string $startDate = null, 
        ?string $endDate = null, 
        int $page = 1, 
        int $limit = 20
    ): array {
        $where = [];
        $params = [];

        if ($userId !== null) {
            $where[] = "user_id = :user_id";
            $params[':user_id'] = $userId;
        }
        if ($action !== null) {
            $where[] = "action = :action";
            $params[':action'] = $action->value;
        }
        if ($targetType !== null) {
            $where[] = "target_type = :target_type";
            $params[':target_type'] = $targetType->value;
        }
        if ($startDate !== null) {
            $where[] = "created_at >= :start_date";
            $params[':start_date'] = $startDate;
        }
        if ($endDate !== null) {
            $where[] = "created_at <= :end_date";
            $params[':end_date'] = $endDate;
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';
        $offset = ($page - 1) * $limit;

        $sql = "SELECT * FROM {$this->table} {$whereClause} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->context->getConnection()->prepare($sql);

        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function countLogs(): int
    {
        return (int)$this->context->getConnection()->query("SELECT COUNT(*) FROM {$this->table}")->fetchColumn();
    }

    /**
     * Tách riêng hàm ánh xạ dữ liệu để tái sử dụng và xử lý lỗi JSON
     */
    private function mapToEntity(array $row): SystemLog
    {
        // Decode chuỗi JSON từ CSDL trả ngược về Array cho Entity
        $oldValueArray = !empty($row['old_value']) ? json_decode((string)$row['old_value'], true) : null;
        $newValueArray = !empty($row['new_value']) ? json_decode((string)$row['new_value'], true) : null;

        return new SystemLog(
            (int)$row['user_id'],
            LogAction::from($row['action']),
            LogTargetType::from($row['target_type']),
            (int)$row['target_id'],
            $oldValueArray,
            $newValueArray,
            (int)$row['id'],
            new DateTimeImmutable($row['created_at'])
        );
    }
}