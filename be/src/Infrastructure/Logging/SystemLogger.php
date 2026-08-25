<?php

namespace App\Infrastructure\Logging;

use App\Domain\Entities\SystemLog;
use App\Infrastructure\Context\DatabaseContext;
use App\Domain\Enums\LogAction;
use DateTimeImmutable;
use PDO;

class SystemLogger
{
    private DatabaseContext $context;
    private string $table = 'system_logs';

    public function __construct(DatabaseContext $context)
    {
        $this->context = $context;
    }

    public function log(SystemLog $log): bool
    {
        $sql = "INSERT INTO {$this->table} (user_id, action, target_type, target_id, old_value, new_value, created_at)
                VALUES (:user_id, :action, :target_type, :target_id, :old_value, :new_value, :created_at)";

        $stmt = $this->context->getConnection()->prepare($sql);
        return $stmt->execute([
            ':user_id' => $log->getUserId(),
            ':action' => $log->getAction()->value,
            ':target_type' => $log->getTargetType(),
            ':target_id' => $log->getTargetId(),
            ':old_value' => is_array($log->getOldValue()) ? json_encode($log->getOldValue()) : $log->getOldValue(),
            ':new_value' => is_array($log->getNewValue()) ? json_encode($log->getNewValue()) : $log->getNewValue(),
            ':created_at' => $log->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    public function getLogs($userId = null, $action = null, $targetType = null, $startDate = null, $endDate = null, $page = 1, $limit = 20): array
    {
        $where = [];
        $params = [];

        if ($userId) {
            $where[] = "user_id = :user_id";
            $params[':user_id'] = $userId;
        }
        if ($action) {
            $where[] = "action = :action";
            $params[':action'] = $action instanceof LogAction ? $action->value : $action;
        }
        if ($targetType) {
            $where[] = "target_type = :target_type";
            $params[':target_type'] = $targetType;
        }
        if ($startDate) {
            $where[] = "created_at >= :start_date";
            $params[':start_date'] = $startDate;
        }
        if ($endDate) {
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
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(function ($row) {
            return new SystemLog(
                (int)$row['user_id'],
                LogAction::from($row['action']),
                $row['target_type'],
                (int)$row['target_id'],
                $row['old_value'],
                $row['new_value'],
                (int)$row['id'],
                new DateTimeImmutable($row['created_at'])
            );
        }, $stmt->fetchAll());
    }
}