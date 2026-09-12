<?php

declare(strict_types=1);

namespace src\WebApi\Controller\V1;

use src\WebApi\Controller\BaseController;
use src\Infrastructure\Repositories\PostRepository;
use src\Infrastructure\Repositories\SystemLogRepository;
use src\WebApi\Routing\Route;
use src\Domain\Entities\Post;
use src\Domain\Entities\SystemLog;
use src\Domain\Enums\PostStatus;
use src\Domain\Enums\LogAction;
use src\Domain\Enums\LogTargetType;
use src\Infrastructure\Repositories\UserRepository;
use src\Application\Services\ContentModerationService;
use Exception;

class PostController extends BaseController
{
    public function __construct(
        private PostRepository $postRepository,
        private SystemLogRepository $logRepository,
        private UserRepository $userRepository,
        private ContentModerationService $moderation
    ) {}

    #[Route('GET', '/api/v1/posts')]
    public function index(): void
    {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $keyword = isset($_GET['keyword']) ? (string)$_GET['keyword'] : null;
        $categoryId = isset($_GET['categoryId']) ? (int)$_GET['categoryId'] : null;

        $posts = $this->postRepository->getPublishedPosts($keyword, $categoryId, null, $page, $limit);
        $data = array_map(fn(Post $p) => $p->toArray(), $posts);

        $this->json($data, 200, "Lấy danh sách bài viết thành công.");
    }

    #[Route('POST', '/api/v1/posts', auth: true)]
    public function create(array $user): void
    {
        $data = $this->getJsonBody();

        if (empty($data['title']) || empty($data['slug']) || empty($data['content']) || empty($data['categoryId'])) {
            $this->error("Thiếu thông tin bắt buộc để tạo bài viết.", 422);
        }

        try {
            // Nhận trạng thái xuất bản từ Frontend, nếu không có thì mặc định là DRAFT
            $status = PostStatus::DRAFT;
            if (!empty($data['status'])) {
                $statusInput = strtoupper((string)$data['status']);
                if ($statusInput === 'PUBLISHED') {
                    $status = PostStatus::PUBLISHED;
                }
            }

            $post = new Post(
                (string)$data['title'],
                (string)$data['slug'],
                (string)$data['content'],
                (int)$user['sub'],
                (int)$data['categoryId'],
                $status
            );
            $moderation = $this->moderateIfPublishing($status === PostStatus::PUBLISHED, $post);

            $this->postRepository->save($post);
            $savedPost = $this->postRepository->findBySlug($post->getSlug());
            $postId = $savedPost ? $savedPost->getId() : 0;

            $this->logRepository->save(new SystemLog(
                (int)$user['sub'],
                LogAction::CREATE,
                LogTargetType::POSTS,
                $postId,
                null,
                $post->toArray()
            ));

            // Trả về toàn bộ dữ liệu bài viết đã lưu để Frontend cập nhật bảng tức thì
            $responseData = $savedPost ? $savedPost->toArray() : [
                'id' => $postId,
                'title' => $post->getTitle(),
                'slug' => $post->getSlug(),
                'content' => $post->getContent(),
                'status' => $post->getStatus()->value,
                'categoryId' => $post->getCategoryId(),
                'authorId' => $post->getAuthorId(),
                'viewCount' => 0,
                'createdAt' => date('Y-m-d H:i:s'),
            ];

            $message = $moderation['outcome'] === 'reject'
                ? (string)$moderation['reason']
                : ($moderation['outcome'] === 'error' ? 'Bộ lọc gặp lỗi; bài viết đang chờ Admin xử lý.' : 'Tạo bài viết thành công.');
            $this->json($responseData, 201, $message);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }

    #[Route('POST', '/api/v1/posts/{id}/approve', auth: true, roles: ['Admin'])]
    public function approve(array $user, int $id): void
    {
        $post = $this->postRepository->findById($id);
        if (!$post) {
            $this->error("Không tìm thấy bài viết.", 404);
        }

        $oldStatus = $post->getStatus()->value;
        $post->approve();
        $this->postRepository->update($post);

        $this->logRepository->save(new SystemLog(
            (int)$user['sub'],
            LogAction::CHANGE_STATUS,
            LogTargetType::POSTS,
            (int)$post->getId(),
            ['status' => $oldStatus],
            ['status' => $post->getStatus()->value]
        ));

        $this->json($post->toArray(), 200, "Đã duyệt và xuất bản bài viết thành công.");
    }
    #[Route('GET', '/api/v1/posts/me', auth: true)]
    public function myPosts(array $user): void
    {
        $posts = $this->postRepository->getPostsByAuthorId((int)$user['sub']);
        $data = array_map(fn(Post $p) => $p->toArray(), $posts);

        $this->json($data, 200, "Lấy danh sách bài viết cá nhân thành công.");
    }

    #[Route('GET', '/api/v1/posts/{id}')]
    public function show(int $id): void
    {
        $post = $this->postRepository->findById($id);
        if (!$post) {
            $this->error("Không tìm thấy bài viết.", 404);
        }
        if (!$post->isPublished()) {
            $this->error("Không tìm thấy bài viết.", 404);
        }

        $data = $post->toArray();

        // Lấy thông tin tác giả từ author_id
        $author = $this->userRepository->findById($post->getAuthorId());
        $data['author_name'] = $author ? $author->getUsername() : 'Ẩn danh';

        $this->json($data, 200, "Lấy chi tiết bài viết thành công.");
    }

    /** Ban quan ly danh cho tac gia/Admin, giu Draft/Pending/Reject khong lo ra cong khai. */
    #[Route('GET', '/api/v1/posts/{id}/manage', auth: true)]
    public function manage(array $user, int $id): void
    {
        $post = $this->postRepository->findById($id);
        if (!$post) $this->error('Không tìm thấy bài viết.', 404);
        $userId = (int)($user['sub'] ?? $user['id'] ?? 0);
        if (($user['role'] ?? 'Member') !== 'Admin' && $post->getAuthorId() !== $userId) {
            $this->error('Bạn không có quyền xem bài viết này.', 403);
        }
        $this->json($post->toArray(), 200, 'Lấy bản quản lý bài viết thành công.');
    }

    #[Route('POST', '/api/v1/posts/{id}/view')]
    public function recordView(int $id): void
    {
        $post = $this->postRepository->findById($id);
        if (!$post) {
            $this->error("Bài viết không tồn tại.", 404);
        }

        $post->incrementViewCount();
        $this->postRepository->update($post);

        $this->json(['viewCount' => $post->getViewCount()], 200, "Ghi nhận lượt xem thành công.");
    }

    #[Route('PUT', '/api/v1/posts/{id}', auth: true)]
    public function update(array $user, int $id): void
    {
        $post = $this->postRepository->findById($id);
        if (!$post) {
            $this->error("Bài viết không tồn tại.", 404);
        }

        $userId = (int)($user['sub'] ?? $user['id'] ?? 0);
        $role = $user['role'] ?? 'Member';

        // Phân quyền: Chỉ Quản trị viên (Admin) hoặc chính Tác giả mới được sửa bài
        if ($role !== 'Admin' && $post->getAuthorId() !== $userId) {
            $this->error("Bạn không có quyền chỉnh sửa bài viết này.", 403);
        }

        $oldData = $post->toArray();
        $data = $this->getJsonBody();

        if (!empty($data['title'])) $post->setTitle((string)$data['title']);
        if (!empty($data['slug'])) $post->setSlug((string)$data['slug']);
        if (!empty($data['content'])) $post->setContent((string)$data['content']);
        if (!empty($data['categoryId'])) $post->setCategoryId((int)$data['categoryId']);
        $requestedStatus = !empty($data['status']) ? strtoupper((string)$data['status']) : null;
        if ($requestedStatus !== null) {
            $status = $requestedStatus === 'PUBLISHED' ? PostStatus::PUBLISHED : PostStatus::DRAFT;
            $post->setStatus($status);
        }

        // Sua mot bai da public (hoac gui dang) phai duoc kiem duyet lai.
        $shouldModerate = $post->getStatus() === PostStatus::PUBLISHED;
        $moderation = $this->moderateIfPublishing($shouldModerate, $post);

        $this->postRepository->update($post);

        // Ghi nhật ký vào bảng system_logs
        try {
            $this->logRepository->save(new SystemLog(
                $userId,
                LogAction::UPDATE,
                LogTargetType::POSTS,
                $id,
                $oldData,
                $post->toArray()
            ));
        } catch (\Throwable $e) {
            // Không làm gián đoạn response nếu ghi log gặp lỗi phụ
        }

        $message = $moderation['outcome'] === 'reject'
            ? (string)$moderation['reason']
            : ($moderation['outcome'] === 'error' ? 'Bộ lọc gặp lỗi; bài viết chuyển sang chờ Admin xử lý.' : 'Cập nhật bài viết thành công.');
        $this->json($post->toArray(), 200, $message);
    }

    #[Route('DELETE', '/api/v1/posts/{id}', auth: true)]
    public function delete(array $user, int $id): void
    {
        $post = $this->postRepository->findById($id);
        if (!$post) {
            $this->error("Bài viết không tồn tại.", 404);
        }

        $userId = (int)($user['sub'] ?? $user['id'] ?? 0);
        $role = $user['role'] ?? 'Member';

        // Phân quyền: Chỉ Admin hoặc tác giả mới được xóa
        if ($role !== 'Admin' && $post->getAuthorId() !== $userId) {
            $this->error("Bạn không có quyền xóa bài viết này.", 403);
        }

        $oldData = $post->toArray();
        $this->postRepository->delete($id);

        // Ghi nhật ký hành động vào system_logs
        try {
            $this->logRepository->save(new SystemLog(
                $userId,
                LogAction::DELETE,
                LogTargetType::POSTS,
                $id,
                $oldData,
                null
            ));
        } catch (\Throwable $e) {
            // Tránh ngắt quãng phản hồi nếu ghi log gặp lỗi phụ
        }

        $this->json(null, 200, "Đã xóa bài viết thành công.");
    }

    /** Draft khong bi quet. Khong co rule dang bat se tu dong Published. */
    private function moderateIfPublishing(bool $shouldModerate, Post $post): array
    {
        if (!$shouldModerate) return ['outcome' => 'skipped', 'reason' => null, 'matchedRules' => []];
        $result = $this->moderation->check($post->getTitle(), $post->getContent());
        if ($result['outcome'] === 'reject') {
            $post->reject();
            $post->setModerationReason($result['reason']);
        } elseif ($result['outcome'] === 'error') {
            $post->submitForReview();
            $post->setModerationReason($result['reason']);
        } else {
            $post->approve();
            $post->setModerationReason(null);
        }
        return $result;
    }
}
