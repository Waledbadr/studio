# Seed test users via PowerShell + Invoke-WebRequest
$users = @(
    @{ email = "admin@estatecare.com"; password = "admin123"; name = "Admin User" }
    @{ email = "manager@estatecare.com"; password = "manager123"; name = "Manager User" }
    @{ email = "maintenance@estatecare.com"; password = "tech123"; name = "Maintenance Tech" }
    @{ email = "ahmed@example.com"; password = "test123"; name = "Ahmed" }
    @{ email = "fatima@example.com"; password = "test123"; name = "Fatima" }
)

Write-Host "Seeding test users..." -ForegroundColor Cyan

foreach ($user in $users) {
    try {
        $body = @{
            email = $user.email
            password = $user.password
            name = $user.name
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:9002/api/auth/register" `
            -Method POST `
            -Headers @{"Content-Type"="application/json"} `
            -Body $body `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $json = $response.Content | ConvertFrom-Json
        if ($json.ok) {
            Write-Host "✓ $($user.email)" -ForegroundColor Green
        } else {
            Write-Host "✗ $($user.email): $($json.error)" -ForegroundColor Red
        }
    } catch {
        $err = $_
        if ($err.Exception.Message -match "exists") {
            Write-Host "→ $($user.email) (already exists)" -ForegroundColor Yellow
        } else {
            Write-Host "✗ $($user.email): $($err.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`nDone! Test credentials:" -ForegroundColor Cyan
Write-Host "  admin@estatecare.com / admin123"
Write-Host "  manager@estatecare.com / manager123"
Write-Host "  maintenance@estatecare.com / tech123"
