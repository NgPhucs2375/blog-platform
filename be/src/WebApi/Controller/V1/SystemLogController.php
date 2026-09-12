<?php
declare(strict_types=1);

namespace src\WebApi\Controller\V1;

use src\WebApi\Controller\BaseController;
use src\Infrastructure\Repositories\SystemLogRepository;
use src\WebApi\Routing\Route;
use src\Domain\Entities\SystemLog;
use src\Domain\Enums\LogAction;
use src\Domain\Enums\LogTargetType;

/**
 * TV4 – Tra cứu nhật ký hệ thống (Job 4.5, Admin only, append-only).
 * Không cung cấp sửa/xóa logs.
 */
class SystemLogController extends BaseController
{
    public function __construct(
        private SystemLogRepository $logRepository
    ) {}

    #[Route('GET', '/api/v1/admin/logs', auth: true, roles: ['Admin'])]
    public function index(array $user): void
    {
        $userId = isset($_GET['userId']) && $_GET['userId'] !== '' ? (int)$_GET['userId'] : null;
        if ($userId !== null && $userId <= 0) {
            $this->error("userId không hợp lệ.", 422);
        }

        $action = null;
        if (isset($_GET['action']) && trim((string)$_GET['action']) !== '') {
            $action = LogAction::tryFrom(trim((string)$_GET['action']));
            if ($action === null) {
                $this->error("Action không hợp lệ. Chỉ chấp nhận: CREATE, UPDATE, DELETE, CHANGE_STATUS.", 422);
            }
        }

        $targetType = null;
        if (isset($_GET['targetType']) && trim((string)$_GET['targetType']) !== '') {
            $targetType = LogTargetType::tryFrom(trim((string)$_GET['targetType']));
            if ($targetType === null) {
                $this->error("TargetType không hợp lệ. Chỉ chấp nhận: " . implode(', ', LogTargetType::values()) . ".", 422);
            }
        }

        $targetId = isset($_GET['targetId']) && $_GET['targetId'] !== '' ? (int)$_GET['targetId'] : null;
        if ($targetId !== null && $targetId <= 0) {
            $this->error("targetId không hợp lệ.", 422);
        }
        $startDate = isset($_GET['startDate']) && trim((string)$_GET['startDate']) !== '' ? trim((string)$_GET['startDate']) : null;
        $endDate = isset($_GET['endDate']) && trim((string)$_GET['endDate']) !== '' ? trim((string)$_GET['endDate']) : null;

        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 20;

        $items = $this->logRepository->getLogs($userId, $action, $targetType, $startDate, $endDate, $page, $limit, $targetId);
        $total = $this->logRepository->countLogs($userId, $action, $targetType, $startDate, $endDate, $targetId);
        $data = array_map(fn(SystemLog $l) => $l->toArray(), $items);

        $this->json([
            'logs' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => $limit > 0 ? (int)ceil($total / $limit) : 0,
            ],
            'filters' => [
                'userId' => $userId,
                'action' => $action?->value,
                'targetType' => $targetType?->value,
                'targetId' => $targetId,
                'startDate' => $startDate,
                'endDate' => $endDate,
            ],
        ], 200, "Lấy nhật ký hệ thống thành công.");
    }
}
