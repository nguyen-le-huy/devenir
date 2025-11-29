# Test create category with curl

# 1. First, login to get token (replace with your admin credentials)

# POST http://localhost:5000/api/auth/login

# Body: { "email": "admin@example.com", "password": "yourpassword" }

# 2. Then create category with token

curl -X POST http://localhost:5000/api/categories/admin \
 -H "Content-Type: application/json" \
 -H "Authorization: Bearer YOUR_TOKEN_HERE" \
 -d '{
"name": "Test Category",
"description": "Test description",
"slug": "test-category",
"parentCategory": null,
"isActive": true,
"sortOrder": 0
}'

# Expected response should show level: 0 and slug: "test-category"
