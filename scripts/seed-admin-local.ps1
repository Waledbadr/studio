# Seed test admin user via in-memory endpoint (works without D1 binding)
Write-Host "Seeding test admin user for local dev..." -ForegroundColor Cyan

$body = @{
    email = "admin@estatecare.com"
    password = "admin123"
    name = "Admin User"
    role = "Admin"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:9002/api/seed-local-user" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body `
        -UseBasicParsing

    $json = $response.Content | ConvertFrom-Json
    if ($json.ok) {
        Write-Host "✓ Admin user created!" -ForegroundColor Green
        Write-Host "  Email: admin@estatecare.com" -ForegroundColor White
        Write-Host "  Password: admin123" -ForegroundColor White
        Write-Host "`nYou can now log in at http://localhost:9002/login" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Failed: $($json.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
