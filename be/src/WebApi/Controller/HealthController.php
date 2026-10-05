<?php
declare(strict_types=1);

namespace src\WebApi\Controller;

use src\WebApi\Routing\Route;

/**
 * Health check. Giữ nguyên response thô như trước (không bọc envelope
 * của ResponseService) để không đổi contract với hạ tầng giám sát.
 */
class HealthController extends BaseController
{
    #[Route('GET', '/api/health')]
    public function check(): void
    {
        http_response_code(200);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status' => 'OK',
            'timestamp' => date('Y-m-d H:i:s'),
        ]);
        exit;
    }
}
