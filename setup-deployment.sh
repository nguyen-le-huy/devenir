#!/usr/bin/env bash

# ====================================================================
# Devenir - Deployment Setup Script
# Setup dự án để chạy trên Tailscale (server) và Vercel (client)
# ====================================================================

echo "🚀 Devenir Deployment Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ====================================================================
# FUNCTIONS
# ====================================================================

print_section() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# ====================================================================
# PRE-CHECKS
# ====================================================================

print_section "Pre-Deployment Checks"

# Check if running from correct directory
if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
    print_error "Must run from project root directory"
    exit 1
fi

print_success "Project structure verified"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not installed"
    exit 1
fi
print_success "Node.js $(node --version) installed"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm not installed"
    exit 1
fi
print_success "npm $(npm --version) installed"

echo ""

# ====================================================================
# SERVER SETUP
# ====================================================================

print_section "Server Setup"

if [ ! -d "server/node_modules" ]; then
    print_info "Installing server dependencies..."
    cd server
    npm install
    cd ..
    print_success "Server dependencies installed"
else
    print_success "Server dependencies already installed"
fi

# Verify server .env
if [ ! -f "server/.env" ]; then
    print_error "server/.env not found - Please create it using the template"
    exit 1
fi
print_success "server/.env exists"

# Check required server env variables
if grep -q "MONGO_URI=" server/.env && grep -q "JWT_SECRET=" server/.env; then
    print_success "Server environment variables configured"
else
    print_error "Missing required server environment variables"
    exit 1
fi

echo ""

# ====================================================================
# CLIENT SETUP
# ====================================================================

print_section "Client Setup"

if [ ! -d "client/node_modules" ]; then
    print_info "Installing client dependencies..."
    cd client
    npm install
    cd ..
    print_success "Client dependencies installed"
else
    print_success "Client dependencies already installed"
fi

# Verify client .env.local
if [ ! -f "client/.env.local" ]; then
    print_error "client/.env.local not found - Please create it using the template"
    exit 1
fi
print_success "client/.env.local exists"

# Check VITE_API_URL
if grep -q "VITE_API_URL=" client/.env.local; then
    VITE_API_URL=$(grep "VITE_API_URL=" client/.env.local | cut -d '=' -f 2 | tr -d ' ')
    print_success "Client API URL configured: $VITE_API_URL"
else
    print_error "VITE_API_URL not set in client/.env.local"
    exit 1
fi

echo ""

# ====================================================================
# DEPLOYMENT CONFIGURATION
# ====================================================================

print_section "Deployment Configuration"

print_info "Server Domain: https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir"
print_info "Client Domain: https://devenir-demo.vercel.app"
print_info "API Endpoint: https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir/api"

echo ""

# ====================================================================
# BUILD & VERIFICATION
# ====================================================================

print_section "Build Verification"

print_info "Building client for production..."
cd client
npm run build

if [ $? -eq 0 ]; then
    print_success "Client build successful"
else
    print_error "Client build failed"
    exit 1
fi

cd ..

echo ""

# ====================================================================
# DEPLOYMENT INSTRUCTIONS
# ====================================================================

print_section "Deployment Instructions"

echo -e "${YELLOW}Server Deployment (Tailscale):${NC}"
echo "  1. SSH into server machine"
echo "  2. Ensure .env is configured with production values"
echo "  3. Run: npm start"
echo "  4. Server will be accessible at: https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir"
echo ""

echo -e "${YELLOW}Client Deployment (Vercel):${NC}"
echo "  1. Push code to GitHub main branch"
echo "  2. Vercel will auto-deploy"
echo "  3. Or manually: vercel --prod"
echo "  4. Client will be accessible at: https://devenir-demo.vercel.app"
echo ""

echo -e "${YELLOW}Environment Variables on Vercel:${NC}"
echo "  Set in Vercel Dashboard → Project Settings → Environment Variables:"
echo "  • VITE_GOOGLE_CLIENT_ID=308105274224-ei1pp9aqtp21t38gbs0j54ej5ci0tkpm.apps.googleusercontent.com"
echo "  • VITE_API_URL=https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir/api"
echo ""

# ====================================================================
# SUMMARY
# ====================================================================

print_section "Setup Complete ✓"

echo -e "${GREEN}Your Devenir project is ready for deployment!${NC}"
echo ""
echo "📋 Quick Reference:"
echo "  • Server: https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir"
echo "  • Client: https://devenir-demo.vercel.app"
echo "  • API: https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir/api"
echo ""
echo "📚 Full documentation: See DEPLOYMENT_GUIDE.md"
echo ""
