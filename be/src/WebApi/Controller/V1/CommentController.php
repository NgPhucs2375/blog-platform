<?php
declare(strict_types=1);

namespace src\WebApi\Controller\V1;

use src\WebApi\Controller\BaseController;
use src\Infrastructure\Repositories\CommentRepository;
use src\Infrastructure\Repositories\PostRepository;
use src\Infrastructure\Repositories\UserRepository;
use src\Infrastructure\Repositories\SystemLogRepository;
use src\WebApi\Routing\Route;
use src\Domain\Entities\Comment;
use src\Domain\Entities\SystemLog;
use src\Domain\Enums\CommentStatus;
use src\Domain\Enums\LogAction;
use src\Domain\Enums\LogTargetType;
use InvalidArgumentException;
use Throwable;

/**
 * TV4 – Quản lý bình luận phân cấp (Job 4.1 + 4.2).
 *
 * Quy ước:
 * - Public chỉ thấy Approved, chỉ dưới bài Published (4.1).
 * - Tạo/reply yêu cầu đăng nhập + tài khoản Active (4.1).
 * - Ẩn cha → ẩn cascade toàn bộ con (4.2). Xóa vật lý → FK
 *   ON DELETE CASCADE tự xóa con, giữ toàn vẹn (4.2).
 */
class CommentController extends BaseController
{
    private const MAX_CONTENT_LENGTH = 2000;
    private const MAX_LIST_FETCH = 1000;

    public function __construct(
        private CommentRepository $commentRepository,
        private PostRepository $postRepository,
        private UserRepository $userRepository,
        private SystemLogRepository $logRepository
    ) {}

    #[Route('GET', '/api/v1/posts/{id}/comments')]
    public function index(int $id): void
    {
        $post = $this->postRepository->findById($id);
        if (!$post) {
            $this->error("Không tìm thấy bài viết.", 404);
        }
        if (!$post->isPublished()) {
            $this->error("Bài viết chưa xuất bản.", 404);
        }

        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(50, (int)$_GET['limit'])) : 10;

        $approved = $this->commentRepository->getByPostId($id, CommentStatus::APPROVED, 1, self::MAX_LIST_FETCH);
        $tree = $this->buildTree($approved);

        $total = count($tree);
        $totalPages = $limit > 0 ? (int)ceil($total / $limit) : 0;
        $items = array_slice($tree, ($page - 1) * $limit, $limit);

        $this->json([
            'comments' => $items,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => $totalPages,
            ],
        ], 200, "Lấy danh sách bình luận thành công.");
    }

    #[Route('POST', '/api/v1/posts/{id}/comments', auth: true)]
    public function store(array $user, int $id): void
    {
        $actorId = $this->requireActiveUser($user);
        $post = $this->requirePublishedPost($id);

        $data = $this->getJsonBody();
        $content = $this->requireContent($data['content'] ?? null);

        $parentId = null;
        if (isset($data['parentId']) && $data['parentId'] !== null && $data['parentId'] !== '') {
            $parentId = (int)$data['parentId'];
            $parent = $this->commentRepository->findById($parentId);
            if (!$parent || $parent->getPostId() !== $post->getId()) {
                $this->error("Bình luận cha không tồn tại trong bài viết này.", 400);
            }
        }

        try {
            $comment = new Comment($post->getId(), $actorId, $content, $parentId);
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage(), 422);
        }

        $newId = $this->commentRepository->save($comment);
        $saved = $this->commentRepository->findById($newId);

        $this->writeLog($actorId, LogAction::CREATE, $newId, null, $saved?->toArray());

        $this->json($saved ? $saved->toArray() : ['commentId' => $newId], 201, "Đã gửi bình luận, đang chờ duyệt.");
    }

    #[Route('POST', '/api/v1/comments/{id}/reply', auth: true)]
    public function reply(array $user, int $id): void
    {
        $actorId = $this->requireActiveUser($user);

        $parent = $this->commentRepository->findById($id);
        if (!$parent) {
            $this->error("Không tìm thấy bình luận cha.", 404);
        }
        $post = $this->requirePublishedPost($parent->getPostId());

        $data = $this->getJsonBody();
        $content = $this->requireContent($data['content'] ?? null);

        try {
            $comment = new Comment($post->getId(), $actorId, $content, $parent->getId());
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage(), 422);
        }

        $newId = $this->commentRepository->save($comment);
        $saved = $this->commentRepository->findById($newId);

        $this->writeLog($actorId, LogAction::CREATE, $newId, null, $saved?->toArray());

        $this->json($saved ? $saved->toArray() : ['commentId' => $newId], 201, "Đã gửi trả lời, đang chờ duyệt.");
    }

    #[Route('POST', '/api/v1/comments/{id}/approve', auth: true, roles: ['Admin'])]
    public function approve(array $user, int $id): void
    {
        $actorId = (int)($user['sub'] ?? 0);
        $found = $this->commentRepository->findById($id);
        if (!$found) {
            $this->error("Không tìm thấy bình luận.", 404);
        }
        if ($found->getStatus() === CommentStatus::APPROVED) {
            $this->json($found->toArray(), 200, "Bình luận đã được duyệt trước đó.");
        }

        $old = $found->toArray();
        $found->approve($actorId);
        $this->commentRepository->update($found);

        $this->writeLog($actorId, LogAction::CHANGE_STATUS, $found->getId(), $old, $found->toArray());

        $this->json($found->toArray(), 200, "Đã duyệt bình luận thành công.");
    }

    #[Route('POST', '/api/v1/comments/{id}/hide', auth: true, roles: ['Admin'])]
    public function hide(array $user, int $id): void
    {
        $actorId = (int)($user['sub'] ?? 0);
        $found = $this->commentRepository->findById($id);
        if (!$found) {
            $this->error("Không tìm thấy bình luận.", 404);
        }
        if ($found->getStatus() === CommentStatus::HIDDEN) {
            $this->json($found->toArray(), 200, "Bình luận đã bị ẩn trước đó.");
        }

        $old = $found->toArray();
        $this->hideWithDescendants($found, $actorId);

        $this->writeLog($actorId, LogAction::CHANGE_STATUS, $found->getId(), $old, $found->toArray());

        $this->json($found->toArray(), 200, "Đã ẩn bình luận (kèm các trả lời con).");
    }

    #[Route('DELETE', '/api/v1/comments/{id}', auth: true)]
    public function destroy(array $user, int $id): void
    {
        $actorId = $this->requireActiveUser($user);

        $found = $this->commentRepository->findById($id);
        if (!$found) {
            $this->error("Không tìm thấy bình luận.", 404);
        }

        $isAdmin = ($user['role'] ?? '') === 'Admin';
        if (!$isAdmin && $found->getUserId() !== $actorId) {
            $this->error("Bạn không có quyền xóa bình luận này.", 403);
        }

        $old = $found->toArray();
        $this->commentRepository->delete($found->getId());

        $this->writeLog($actorId, LogAction::DELETE, $id, $old, null);

        $this->json(null, 200, "Đã xóa bình luận thành công.");
    }

    /**
     * TV4 hỗ trợ Reports/Statistics: hàng đợi kiểm duyệt cross-post (Admin).
     * Trả phẳng theo thời gian mới nhất (danh sách việc cần làm, không phải cây).
     */
    #[Route('GET', '/api/v1/admin/comments', auth: true, roles: ['Admin'])]
    public function adminIndex(array $user): void
    {
        $status = null;
        if (isset($_GET['status']) && trim((string)$_GET['status']) !== '') {
            $status = CommentStatus::tryFrom(trim((string)$_GET['status']));
            if ($status === null) {
                $this->error("Status không hợp lệ. Chỉ chấp nhận: Pending, Approved, Hidden.", 422);
            }
        }
        $postId = isset($_GET['postId']) && $_GET['postId'] !== '' ? (int)$_GET['postId'] : null;
        if ($postId !== null && $postId <= 0) {
            $this->error("postId không hợp lệ.", 422);
        }

        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 20;

        $items = $this->commentRepository->searchComments($status, $postId, $page, $limit);
        $total = $this->commentRepository->countSearchComments($status, $postId);
        $data = array_map(fn(Comment $c) => $c->toArray(), $items);

        $this->json([
            'comments' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => $limit > 0 ? (int)ceil($total / $limit) : 0,
            ],
            'filters' => [
                'status' => $status?->value,
                'postId' => $postId,
            ],
        ], 200, "Lấy hàng đợi kiểm duyệt bình luận thành công.");
    }

    /**
     * TV4 hỗ trợ Reports/Statistics: tổng hợp số lượng theo trạng thái (Admin).
     */
    #[Route('GET', '/api/v1/admin/comments/stats', auth: true, roles: ['Admin'])]
    public function stats(array $user): void
    {
        $postId = isset($_GET['postId']) && $_GET['postId'] !== '' ? (int)$_GET['postId'] : null;
        if ($postId !== null && $postId <= 0) {
            $this->error("postId không hợp lệ.", 422);
        }

        $stats = $this->commentRepository->countStats($postId);

        $this->json([
            'postId' => $postId,
            'total' => $stats['total'],
            'pending' => $stats['pending'],
            'approved' => $stats['approved'],
            'hidden' => $stats['hidden'],
        ], 200, "Lấy thống kê bình luận thành công.");
    }

    /**
     * Số bình luận Approved của 1 bài (public, cho badge/UI và reports phía đọc).
     */
    #[Route('GET', '/api/v1/posts/{id}/comments/count')]
    public function count(int $id): void
    {
        $post = $this->postRepository->findById($id);
        if (!$post) {
            $this->error("Không tìm thấy bài viết.", 404);
        }
        if (!$post->isPublished()) {
            $this->error("Bài viết chưa xuất bản.", 404);
        }

        $this->json([
            'postId' => $id,
            'total' => $this->commentRepository->countByPostId($id, CommentStatus::APPROVED),
        ], 200, "Lấy số lượng bình luận thành công.");
    }

    // --- Helpers ---

    /**
     * Dựng cây từ danh sách phẳng: con mồ côi (cha ngoài tập lọc,
     * ví dụ cha Pending/Hidden) được nâng lên gốc để không mất dữ liệu.
     * @param Comment[] $comments
     * @return array<int, array<string, mixed>>
     */
    private function buildTree(array $comments): array
    {
        $ids = [];
        foreach ($comments as $c) {
            $ids[$c->getId()] = true;
        }

        $children = [];
        $roots = [];
        foreach ($comments as $c) {
            $pid = $c->getParentId();
            if ($pid === null || !isset($ids[$pid])) {
                $roots[] = $c;
            } else {
                $children[$pid][] = $c;
            }
        }

        $build = function (Comment $c) use (&$build, $children): array {
            $node = $c->toArray();
            $node['replies'] = [];
            foreach ($children[$c->getId()] ?? [] as $child) {
                $node['replies'][] = $build($child);
            }
            return $node;
        };

        return array_map($build, $roots);
    }

    private function hideWithDescendants(Comment $comment, int $actorId): void
    {
        $comment->hide($actorId);
        $this->commentRepository->update($comment);

        foreach ($this->commentRepository->getReplies($comment->getId()) as $child) {
            if ($child->getStatus() !== CommentStatus::HIDDEN) {
                $this->hideWithDescendants($child, $actorId);
            }
        }
    }

    private function requireActiveUser(array $user): int
    {
        $actorId = (int)($user['sub'] ?? 0);
        if ($actorId <= 0) {
            $this->error("Truy cập bị từ chối. Token xác thực không tồn tại.", 401);
        }

        $actor = $this->userRepository->findById($actorId);
        if (!$actor || $actor->isDeleted() || !$actor->isActive()) {
            $this->error("Tài khoản đã bị khóa hoặc không hoạt động.", 403);
        }

        return $actorId;
    }

    private function requirePublishedPost(int $postId): \src\Domain\Entities\Post
    {
        $post = $this->postRepository->findById($postId);
        if (!$post) {
            $this->error("Không tìm thấy bài viết.", 404);
        }
        if (!$post->isPublished()) {
            $this->error("Chỉ được bình luận dưới bài viết đã xuất bản.", 400);
        }

        return $post;
    }

    private function requireContent(mixed $content): string
    {
        $trimmed = trim((string)($content ?? ''));
        if ($trimmed === '') {
            $this->error("Nội dung bình luận không được để trống.", 422);
        }
        if (mb_strlen($trimmed) > self::MAX_CONTENT_LENGTH) {
            $this->error("Nội dung bình luận tối đa " . self::MAX_CONTENT_LENGTH . " ký tự.", 422);
        }

        return $trimmed;
    }

    private function writeLog(int $actorId, LogAction $action, int $targetId, ?array $old, ?array $new): void
    {
        try {
            $this->logRepository->save(new SystemLog(
                $actorId, $action, LogTargetType::COMMENTS, $targetId, $old, $new
            ));
        } catch (Throwable) {
            // Không chặn flow chính nếu ghi log lỗi (cùng contract TV2).
        }
    }
}
