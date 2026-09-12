<?php
declare(strict_types=1);

namespace src\WebApi\Controller\V1;

use src\Application\Services\ContentModerationService;
use src\Infrastructure\Repositories\ModerationRuleRepository;
use src\WebApi\Controller\BaseController;
use src\WebApi\Routing\Route;

class ModerationRuleController extends BaseController
{
    public function __construct(
        private ModerationRuleRepository $rules,
        private ContentModerationService $moderation
    ) {}

    #[Route('GET', '/api/v1/admin/moderation-rules', auth: true, roles: ['Admin'])]
    public function index(array $user): void
    {
        $this->json(array_map([$this->rules, 'normalize'], $this->rules->all()));
    }

    #[Route('POST', '/api/v1/admin/moderation-rules', auth: true, roles: ['Admin'])]
    public function create(array $user): void
    {
        $rule = $this->validatedPayload($this->getJsonBody());
        $this->json($this->rules->create($rule), 201, 'Đã thêm quy tắc kiểm duyệt.');
    }

    #[Route('PUT', '/api/v1/admin/moderation-rules/{id}', auth: true, roles: ['Admin'])]
    public function update(array $user, int $id): void
    {
        if ($this->rules->find($id) === null) $this->error('Không tìm thấy quy tắc.', 404);
        $this->json($this->rules->update($id, $this->validatedPayload($this->getJsonBody())), 200, 'Đã cập nhật quy tắc.');
    }

    #[Route('PATCH', '/api/v1/admin/moderation-rules/{id}/toggle', auth: true, roles: ['Admin'])]
    public function toggle(array $user, int $id): void
    {
        $rule = $this->rules->toggle($id);
        if ($rule === null) $this->error('Không tìm thấy quy tắc.', 404);
        $this->json($rule, 200, $rule['isEnabled'] ? 'Đã bật quy tắc.' : 'Đã tắt quy tắc.');
    }

    #[Route('DELETE', '/api/v1/admin/moderation-rules/{id}', auth: true, roles: ['Admin'])]
    public function delete(array $user, int $id): void
    {
        if (!$this->rules->delete($id)) $this->error('Không tìm thấy quy tắc.', 404);
        $this->json(null, 200, 'Đã xóa quy tắc.');
    }

    #[Route('POST', '/api/v1/admin/moderation-rules/test', auth: true, roles: ['Admin'])]
    public function test(array $user): void
    {
        $data = $this->getJsonBody();
        $result = $this->moderation->check((string)($data['title'] ?? ''), (string)($data['content'] ?? ''));
        $this->json($result, 200, $result['outcome'] === 'pass' ? 'Nội dung đạt kiểm duyệt.' : 'Đã có kết quả kiểm duyệt.');
    }

    private function validatedPayload(array $data): array
    {
        $type = strtolower(trim((string)($data['ruleType'] ?? $data['rule_type'] ?? '')));
        $pattern = trim((string)($data['pattern'] ?? ''));
        $name = trim((string)($data['name'] ?? ''));
        $reason = trim((string)($data['reason'] ?? ''));
        if ($name === '') $this->error('Tên quy tắc là bắt buộc.', 422);
        try {
            $this->moderation->assertValidRule($type, $pattern);
        } catch (\Throwable $e) {
            $this->error($e->getMessage(), 422);
        }
        return ['name' => $name, 'pattern' => $pattern, 'ruleType' => $type, 'reason' => $reason, 'isEnabled' => !array_key_exists('isEnabled', $data) || (bool)$data['isEnabled']];
    }
}
