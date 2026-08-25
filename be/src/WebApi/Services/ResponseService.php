<?php
declare(strict_types=1);

namespace src\Presentation\WebApi\Services;

class ResponseService
{
    // Thay đổi từ : void sang : never
    public static function json(mixed $data, int $statusCode = 200, string $message = "Thành công"): never
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode([
            'success' => $statusCode >= 200 && $statusCode < 300,
            'status_code' => $statusCode,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s'),
        ], JSON_UNESCAPED_UNICODE);
        
        exit;
    }

    // Thay đổi từ : void sang : never
    public static function error(string $message, int $statusCode = 400, mixed $errors = null): never
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode([
            'success' => false,
            'status_code' => $statusCode,
            'message' => $message,
            'errors' => $errors,
            'timestamp' => date('Y-m-d H:i:s'),
        ], JSON_UNESCAPED_UNICODE);
        
        exit;
    }
}