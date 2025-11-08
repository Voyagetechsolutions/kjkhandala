# Database Setup Script for KJ Khandala Bus Management System
# Run this from the backend folder

Write-Host "🚀 Setting up database..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Generate Prisma Client
Write-Host "📦 Step 1: Generating Prisma Client..." -ForegroundColor Yellow
npm run db:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    Write-Host "Please check your schema.prisma file for errors" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prisma Client generated successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Push schema to database
Write-Host "📊 Step 2: Pushing schema to database..." -ForegroundColor Yellow
npm run db:push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push schema to database" -ForegroundColor Red
    Write-Host "Please check your DATABASE_URL in .env file" -ForegroundColor Red
    Write-Host "Example: DATABASE_URL='postgresql://postgres:postgres@localhost:5432/kjkhandala_db'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Schema pushed to database successfully!" -ForegroundColor Green
Write-Host ""

# Step 3: Seed database
Write-Host "🌱 Step 3: Seeding database with test data..." -ForegroundColor Yellow
npm run db:seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
Write-Host ""

# Success message
Write-Host "🎉 Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Default Login Credentials:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Email: admin@kjkhandala.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: npm run dev" -ForegroundColor White
Write-Host "  2. Open: http://localhost:3001/health" -ForegroundColor White
Write-Host "  3. (Optional) Run: npm run db:studio" -ForegroundColor White
Write-Host ""
