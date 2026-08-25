<?php
declare(strict_types=1);

namespace src\Presentation\WebApi\Controllers;

use src\Presentation\WebApi\Services\ResponseService;

abstract class BaseController
{
    protected function getJsonBody(): array
    {
        $body = file_get_contents('php://input');
        $data = json_decode((string)$body, true);
        return is_array($data) ? $data : [];
    }

    protected function json(mixed $data, int $statusCode = 200, string $message = "Thành công"): void
    {
        ResponseService::json($data, $statusCode, $message);
    }

    protected function error(string $message, int $statusCode = 400, mixed $errors = null): void
    {
        ResponseService::error($message, $statusCode, $errors);
    }
}