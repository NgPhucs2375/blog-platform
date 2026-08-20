<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$response = [
    'system' => 'Blog Platform API',
    'status' => 'OK',
    'timestamp' => date('Y-m-d H:i:s'),
    'services' => []
];

// 1. Kiểm tra kết nối PostgreSQL
try {
    $host = getenv('DB_HOST') ?: 'postgres';
    $port = getenv('DB_PORT') ?: '5432';
    $db   = getenv('DB_DATABASE') ?: 'blog_db';
    $user = getenv('DB_USERNAME') ?: 'blog_user';
    $pass = getenv('DB_PASSWORD') ?: 'blog_secret';

    $dsn = "pgsql:host={$host};port={$port};dbname={$db}";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $response['services']['database'] = [
        'status' => 'Connected',
        'driver' => 'PostgreSQL 16'
    ];
} catch (Throwable $e) {
    $response['services']['database'] = [
        'status' => 'Failed',
        'error' => $e->getMessage()
    ];
}

// 2. Kiểm tra kết nối Redis
try {
    $redisHost = getenv('REDIS_HOST') ?: 'redis';
    $redisPort = (int)(getenv('REDIS_PORT') ?: 6379);

    $redis = new Redis();
    $redis->connect($redisHost, $redisPort, 2.0);
    $redis->set('ping_check', 'pong', 10);

    $response['services']['cache'] = [
        'status' => 'Connected',
        'driver' => 'Redis 7.2',
        'ping' => $redis->get('ping_check')
    ];
} catch (Throwable $e) {
    $response['services']['cache'] = [
        'status' => 'Failed',
        'error' => $e->getMessage()
    ];
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);