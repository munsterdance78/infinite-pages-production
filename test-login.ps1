# Test Login Script
# Authenticates with Supabase and saves access token

Write-Host "=== Supabase Login Test ===" -ForegroundColor Cyan
Write-Host ""

# Read .env.local file
$envFile = ".env.local"

if (-Not (Test-Path $envFile)) {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please make sure you're running this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "Reading .env.local..." -ForegroundColor Gray

# Parse .env.local and extract variables
$supabaseUrl = $null
$anonKey = $null

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^NEXT_PUBLIC_SUPABASE_URL=(.+)$') {
        $supabaseUrl = $matches[1].Trim()
    }
    if ($_ -match '^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$') {
        $anonKey = $matches[1].Trim()
    }
}

# Validate environment variables
if (-Not $supabaseUrl) {
    Write-Host "ERROR: NEXT_PUBLIC_SUPABASE_URL not found in .env.local" -ForegroundColor Red
    exit 1
}

if (-Not $anonKey) {
    Write-Host "ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "Supabase URL: $supabaseUrl" -ForegroundColor Green
Write-Host "Anon Key: $($anonKey.Substring(0, 20))..." -ForegroundColor Green
Write-Host ""

# Prepare login request
$authUrl = "$supabaseUrl/auth/v1/token?grant_type=password"
$headers = @{
    "apikey" = $anonKey
    "Content-Type" = "application/json"
}

$body = @{
    email = "test@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

Write-Host "Attempting login..." -ForegroundColor Yellow
Write-Host "Email: test@example.com" -ForegroundColor Gray
Write-Host "POST: $authUrl" -ForegroundColor Gray
Write-Host ""

# Make the login request
try {
    $response = Invoke-RestMethod -Uri $authUrl -Method Post -Headers $headers -Body $body -ContentType "application/json"

    if ($response.access_token) {
        Write-Host "SUCCESS! Login successful" -ForegroundColor Green
        Write-Host ""

        $accessToken = $response.access_token

        Write-Host "Access Token: $($accessToken.Substring(0, 30))..." -ForegroundColor Yellow
        Write-Host "Token Type: $($response.token_type)" -ForegroundColor Gray
        Write-Host "Expires In: $($response.expires_in) seconds" -ForegroundColor Gray
        Write-Host ""

        # Save token to file
        $accessToken | Out-File -FilePath "test-token.txt" -NoNewline
        Write-Host "Token saved to test-token.txt" -ForegroundColor Green

        # Also print user info if available
        if ($response.user) {
            Write-Host ""
            Write-Host "=== USER INFO ===" -ForegroundColor Cyan
            Write-Host "User ID: $($response.user.id)" -ForegroundColor White
            Write-Host "Email: $($response.user.email)" -ForegroundColor White
            Write-Host "Created: $($response.user.created_at)" -ForegroundColor Gray
        }

    } else {
        Write-Host "ERROR: No access_token in response" -ForegroundColor Red
        Write-Host "Response:" -ForegroundColor Yellow
        $response | ConvertTo-Json -Depth 5 | Write-Host
        exit 1
    }

} catch {
    Write-Host "ERROR: Login failed!" -ForegroundColor Red
    Write-Host ""

    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
        Write-Host ""

        # Try to get response body
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()

        Write-Host "Response Body:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Red
        Write-Host ""
    } else {
        Write-Host "Error Details:" -ForegroundColor Yellow
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
    }

    Write-Host "TROUBLESHOOTING:" -ForegroundColor Yellow
    Write-Host "1. Make sure the test user exists in Supabase Authentication" -ForegroundColor White
    Write-Host "2. Go to Supabase Dashboard > Authentication > Users" -ForegroundColor White
    Write-Host "3. Create a user with:" -ForegroundColor White
    Write-Host "   Email: test@example.com" -ForegroundColor Gray
    Write-Host "   Password: TestPassword123!" -ForegroundColor Gray
    Write-Host "4. Or change the credentials in this script to match an existing user" -ForegroundColor White

    exit 1
}

Write-Host ""
Write-Host "=== Login Complete ===" -ForegroundColor Cyan
Write-Host "You can now run test-api.ps1 to test the API" -ForegroundColor Green
