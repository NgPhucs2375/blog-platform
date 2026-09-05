<?php
declare(strict_types=1);

namespace src\WebApi\Controller\V1;

use src\WebApi\Controller\BaseController;
use src\Infrastructure\Repositories\CategoryRepository;
use src\WebApi\Routing\Route;
use src\Domain\Entities\Category;
use Exception;

class CategoryController extends BaseController
{
    public function __construct(
        private CategoryRepository $categoryRepository
    ) {}

    #[Route('GET', '/api/v1/categories')]
    public function index(): void
    {
        $categories = $this->categoryRepository->getAllCategories();
        $data = array_map(fn(Category $c) => $c->toArray(), $categories);
        $this->json($data, 200, "Lấy danh sách chuyên mục thành công.");
    }

    #[Route('POST', '/api/v1/categories', auth: true, roles: ['Admin'])]
    public function create(array $user): void
    {
        $data = $this->getJsonBody();
        if (empty($data['name']) || empty($data['slug'])) {
            $this->error("Tên và đường dẫn chuyên mục không được để trống.", 422);
        }

        if ($this->categoryRepository->findBySlug($data['slug'])) {
            $this->error("Đường dẫn slug chuyên mục đã tồn tại.", 409);
        }

        try {
            $category = new Category(
                (string)$data['name'],
                (string)$data['slug'],
                isset($data['description']) ? (string)$data['description'] : null,
                isset($data['sortOrder']) ? (int)$data['sortOrder'] : 0,
                isset($data['displayOrder']) ? (int)$data['displayOrder'] : 0
            );

            $this->categoryRepository->save($category);
            $this->json(null, 201, "Tạo chuyên mục thành công.");
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }

    #[Route('DELETE', '/api/v1/categories/{id}', auth: true, roles: ['Admin'])]
    public function delete(array $user, int $id): void
    {
        if ($this->categoryRepository->hasPosts($id)) {
            $this->error("Không thể xóa chuyên mục này vì đang có bài viết liên kết.", 400);
        }

        $this->categoryRepository->delete($id);
        $this->json(null, 200, "Xóa chuyên mục thành công.");
    }
}