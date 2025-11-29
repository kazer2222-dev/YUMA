# Create .env.local file with required environment variables
# This script creates the .env.local file with JWT_SECRET

$envContent = @"
# JWT Secret - Required for authentication
# Generate a secure random string for production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-use-random-string

# Database URL
DATABASE_URL=file:./prisma/dev.db

# NextAuth Configuration (optional, for compatibility)
NEXTAUTH_SECRET=your-super-secret-jwt-key-change-this-in-production-use-random-string
NEXTAUTH_URL=http://localhost:3000

# OpenAI API Key (optional, for AI features)
# OPENAI_API_KEY=sk-your-openai-api-key-here

# Development PIN (optional, for easier testing)
# DEV_PIN=123456

# Email Configuration (optional, for production)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM="YUMA" <your-email@gmail.com>
"@

# Check if .env.local already exists
if (Test-Path .env.local) {
    Write-Host "⚠️  .env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne 'y' -and $overwrite -ne 'Y') {
        Write-Host "Cancelled. .env.local not modified." -ForegroundColor Gray
        exit
    }
}

# Write the file
$envContent | Out-File -FilePath .env.local -Encoding utf8 -NoNewline

Write-Host "✅ Created .env.local file" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Generate a secure JWT_SECRET!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Generate a secure secret using:" -ForegroundColor Cyan
Write-Host "  node -e `"console.log(require('crypto').randomBytes(32).toString('hex'))`"" -ForegroundColor White
Write-Host ""
Write-Host "Then update JWT_SECRET in .env.local with the generated value." -ForegroundColor Gray
Write-Host ""

