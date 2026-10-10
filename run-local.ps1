$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDirectory = Join-Path $projectRoot 'be'
$frontendDirectory = Join-Path $projectRoot 'fe\frontend'
$apiPort = 8000
$frontendPort = 3000
$apiProcess = $null

function Test-LocalPort([int]$port) {
    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $connect = $client.ConnectAsync('127.0.0.1', $port)
        return $connect.Wait(500) -and $client.Connected
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

$php = Get-Command php.exe -ErrorAction SilentlyContinue
$phpPath = $null
if ($php) { $phpPath = $php.Source }
if (-not $php) {
    $laragonPhpRoot = 'C:\laragon\bin\php'
    if (Test-Path $laragonPhpRoot) {
        $php = Get-ChildItem $laragonPhpRoot -Filter php.exe -Recurse -ErrorAction SilentlyContinue |
            Sort-Object FullName -Descending |
            Select-Object -First 1
        if ($php) { $phpPath = $php.FullName }
    }
}
if (-not $php) {
    throw 'PHP chưa được tìm thấy. Hãy mở Laragon hoặc thêm PHP vào PATH rồi chạy lại.'
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'Không tìm thấy npm. Hãy cài Node.js rồi chạy lại.'
}

if (Test-LocalPort $frontendPort) {
    Start-Process "http://localhost:$frontendPort"
    Write-Host "Giao diện đã chạy tại http://localhost:$frontendPort"
    Write-Host 'Nếu API chưa phản hồi, hãy dừng máy chủ cũ đang chiếm cổng 8000 rồi chạy lại script.'
    exit 0
}

try {
    if (-not (Test-LocalPort $apiPort)) {
        $stdout = Join-Path $backendDirectory 'storage\logs\dev-server.out.log'
        $stderr = Join-Path $backendDirectory 'storage\logs\dev-server.err.log'
        $apiProcess = Start-Process -FilePath $phpPath `
            -ArgumentList @('artisan', 'serve', '--host=127.0.0.1', "--port=$apiPort") `
            -WorkingDirectory $backendDirectory `
            -WindowStyle Hidden -PassThru `
            -RedirectStandardOutput $stdout -RedirectStandardError $stderr

        $ready = $false
        for ($attempt = 0; $attempt -lt 30; $attempt++) {
            if (Test-LocalPort $apiPort) { $ready = $true; break }
            if ($apiProcess.HasExited) { break }
            Start-Sleep -Milliseconds 500
        }
        if (-not $ready) {
            throw "Laravel không khởi động được. Xem log tại $stderr"
        }
    }

    $env:NEXT_PUBLIC_API_URL = '/api'
    $env:LARAVEL_API_URL = "http://127.0.0.1:$apiPort"
    Write-Host "Laravel API đang chạy phía sau giao diện tại cổng $apiPort."
    Write-Host "Mở http://localhost:$frontendPort; nhấn Ctrl+C để dừng."

    Push-Location $frontendDirectory
    try {
        & npm run dev -- --port $frontendPort
    } finally {
        Pop-Location
    }
} finally {
    if ($apiProcess -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
    }
}
