<?php
declare(strict_types=1);

namespace src\Presentation\WebApi\Controllers\V1;

use src\Presentation\WebApi\Controllers\BaseController;
use src\Infrastructure\Repositories\PostRepository;
use src\Infrastructure\Repositories\SystemLogRepository;
use src\Presentation\WebApi\Middleware\AuthMiddleware;
use src\Presentation\WebApi\Middleware\RoleMiddleware;
use src\Domain\Entities\Post;
use src\Domain\Entities\SystemLog;
use src\Domain\Enums\PostStatus;
use src\Domain\Enums\LogAction;
use Exception;

class PostController extends BaseController
{
    public function __construct(
        private PostRepository $postRepository,
        private SystemLogRepository $logRepository,
        private AuthMiddleware $authMiddleware
    ) {}

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

    public function create(): void
    {
        $user = $this->authMiddleware->handle();
        $data = $this->getJsonBody();

        if (empty($data['title']) || empty($data['slug']) || empty($data['content']) || empty($data['categoryId'])) {
            $this->error("Thiếu thông tin bắt buộc để tạo bài viết.", 422);
        }

        try {
            $post = new Post(
                (string)$data['title'],
                (string)$data['slug'],
                (string)$data['content'],
                (int)$user['sub'],
                (int)$data['categoryId'],
                PostStatus::DRAFT
            );

            // Lưu ý: Nếu dùng Auto-increment ID mà Base Repository không trả về ID, 
            // có thể cần gọi hàm tìm theo slug để lấy ID ghi log nếu cần thiết.
            $this->postRepository->save($post);
            $savedPost = $this->postRepository->findBySlug($post->getSlug());
            $postId = $savedPost ? $savedPost->getId() : 0;

            $this->logRepository->save(new SystemLog(
                (int)$user['sub'],
                LogAction::CREATE,
                'Posts',
                $postId,
                null,
                $post->toArray()
            ));

            $this->json(['postId' => $postId], 201, "Tạo bài viết thành công (trạng thái Nháp).");
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }

    public function approve(int $id): void
    {
        $user = $this->authMiddleware->handle();
        RoleMiddleware::checkRole($user, ['Admin']);

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
            'Posts',
            (int)$post->getId(),
            ['status' => $oldStatus],
            ['status' => $post->getStatus()->value]
        ));

        $this->json($post->toArray(), 200, "Đã duyệt và xuất bản bài viết thành công.");
    }
}