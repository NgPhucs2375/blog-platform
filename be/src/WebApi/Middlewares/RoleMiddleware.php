<?php

namespace src\WebApi\Middleware;

use src\WebApi\Services\ResponseService;

class RoleMiddleware
{
    public static function checkRole(array $userPayload, array $allowedRoles)
    {
        $role = $userPayload['role'] ?? null;

        if (!$role || !in_array($role, $allowedRoles, true)) {
            ResponseService::error("Bạn không có quyền thực hiện hành động này.", 403);
        }
    }
}