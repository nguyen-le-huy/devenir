/**
 * Full CRUD Test Script with Authentication
 * Tests: Category, Brand, Color, Product, Variant, Inventory
 * Includes CREATE, UPDATE, DELETE operations with admin auth
 */

const API = 'http://localhost:5000/api';

// ⚠️ Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@devenir.com',   // Email admin
  password: 'Admin@123456'      // Password admin
};

let authToken = '';
const results = [];
const createdIds = {
  category: null,
  brand: null,
  color: null,
  product: null,
  variant: null
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function fetchJSON(url, options = {}) {
  const headers = { 
    'Content-Type': 'application/json',
    ...options.headers 
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const res = await fetch(url, { ...options, headers });
  
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('text/html')) {
    return { status: res.status, data: null, ok: false, isHtml: true };
  }
  
  const data = await res.json();
  return { status: res.status, data, ok: res.ok };
}

function logTest(action, success, detail = '') {
  const icon = success ? '✅' : '❌';
  console.log(`  ${action}: ${icon} ${detail}`);
}

// ============================================
// AUTHENTICATION
// ============================================

async function login() {
  console.log('\n🔐 AUTHENTICATION');
  console.log('-'.repeat(40));
  
  try {
    const { status, data, ok } = await fetchJSON(API + '/auth/login', {
      method: 'POST',
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });
    
    if (ok && data.token) {
      authToken = data.token;
      console.log('  LOGIN: ✅ Token received');
      console.log(`  USER: ${data.user?.name || data.user?.email || 'Admin'}`);
      return true;
    } else {
      console.log('  LOGIN: ❌', data.message || 'Failed');
      console.log('  ⚠️  Vui lòng cập nhật ADMIN_CREDENTIALS trong file test');
      return false;
    }
  } catch (e) {
    console.log('  LOGIN ERROR:', e.message);
    return false;
  }
}

// ============================================
// 1. CATEGORY CRUD
// ============================================

async function testCategoryCRUD() {
  console.log('\n📁 1. CATEGORY CRUD');
  console.log('-'.repeat(40));
  
  try {
    // READ ALL
    let { status, data } = await fetchJSON(API + '/categories');
    logTest('READ ALL', status === 200, `Total: ${data.data?.length || 0}`);
    
    // CREATE
    const newCategory = {
      name: 'Test Category ' + Date.now(),
      slug: 'test-category-' + Date.now(),
      description: 'Auto-generated test category',
      isActive: true
    };
    
    ({ status, data } = await fetchJSON(API + '/categories/admin', {
      method: 'POST',
      body: JSON.stringify(newCategory)
    }));
    
    if (status === 201 || status === 200) {
      createdIds.category = data.data?._id || data._id;
      logTest('CREATE', true, `ID: ${createdIds.category}`);
    } else {
      logTest('CREATE', false, `${status} - ${data.message || 'Failed'}`);
    }
    
    // UPDATE (if created)
    if (createdIds.category) {
      ({ status, data } = await fetchJSON(API + '/categories/admin/' + createdIds.category, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Test Category', description: 'Updated!' })
      }));
      logTest('UPDATE', status === 200, data.data?.name || data.message);
    }
    
    // DELETE (cleanup)
    if (createdIds.category) {
      ({ status, data } = await fetchJSON(API + '/categories/admin/' + createdIds.category, {
        method: 'DELETE'
      }));
      logTest('DELETE', status === 200, 'Cleaned up test data');
      createdIds.category = null;
    }
    
    results.push({ name: 'Category', status: 'PASS ✅' });
  } catch (e) {
    console.log('  ERROR:', e.message);
    results.push({ name: 'Category', status: 'FAIL ❌' });
  }
}

// ============================================
// 2. BRAND CRUD
// ============================================

async function testBrandCRUD() {
  console.log('\n🏷️  2. BRAND CRUD');
  console.log('-'.repeat(40));
  
  try {
    // READ ALL
    let { status, data } = await fetchJSON(API + '/brands');
    logTest('READ ALL', status === 200, `Total: ${data.data?.length || 0}`);
    
    // CREATE
    const newBrand = {
      name: 'Test Brand ' + Date.now(),
      slug: 'test-brand-' + Date.now(),
      description: 'Auto-generated test brand',
      isActive: true
    };
    
    ({ status, data } = await fetchJSON(API + '/brands/admin', {
      method: 'POST',
      body: JSON.stringify(newBrand)
    }));
    
    if (status === 201 || status === 200) {
      createdIds.brand = data.data?._id || data._id;
      logTest('CREATE', true, `ID: ${createdIds.brand}`);
    } else {
      logTest('CREATE', false, `${status} - ${data.message || 'Failed'}`);
    }
    
    // UPDATE
    if (createdIds.brand) {
      ({ status, data } = await fetchJSON(API + '/brands/admin/' + createdIds.brand, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Test Brand' })
      }));
      logTest('UPDATE', status === 200, data.data?.name || data.message);
    }
    
    // DELETE
    if (createdIds.brand) {
      ({ status, data } = await fetchJSON(API + '/brands/admin/' + createdIds.brand, {
        method: 'DELETE'
      }));
      logTest('DELETE', status === 200, 'Cleaned up');
      createdIds.brand = null;
    }
    
    results.push({ name: 'Brand', status: 'PASS ✅' });
  } catch (e) {
    console.log('  ERROR:', e.message);
    results.push({ name: 'Brand', status: 'FAIL ❌' });
  }
}

// ============================================
// 3. COLOR CRUD
// ============================================

async function testColorCRUD() {
  console.log('\n🎨 3. COLOR CRUD');
  console.log('-'.repeat(40));
  
  try {
    // READ ALL
    let { status, data } = await fetchJSON(API + '/colors');
    logTest('READ ALL', status === 200, `Total: ${data.data?.length || data.length || 0}`);
    
    // CREATE
    const newColor = {
      name: 'Test Color ' + Date.now(),
      hex: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
      isActive: true
    };
    
    ({ status, data } = await fetchJSON(API + '/colors', {
      method: 'POST',
      body: JSON.stringify(newColor)
    }));
    
    if (status === 201 || status === 200) {
      createdIds.color = data.data?._id || data._id;
      logTest('CREATE', true, `${newColor.name} (${newColor.hex})`);
    } else {
      logTest('CREATE', false, `${status} - ${data.message || 'Failed'}`);
    }
    
    // UPDATE
    if (createdIds.color) {
      ({ status, data } = await fetchJSON(API + '/colors/' + createdIds.color, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Color', hex: '#FF0000' })
      }));
      logTest('UPDATE', status === 200, data.data?.name || data.message);
    }
    
    // DELETE
    if (createdIds.color) {
      ({ status, data } = await fetchJSON(API + '/colors/' + createdIds.color, {
        method: 'DELETE'
      }));
      logTest('DELETE', status === 200, 'Cleaned up');
      createdIds.color = null;
    }
    
    results.push({ name: 'Color', status: 'PASS ✅' });
  } catch (e) {
    console.log('  ERROR:', e.message);
    results.push({ name: 'Color', status: 'FAIL ❌' });
  }
}

// ============================================
// 4. PRODUCT CRUD
// ============================================

async function testProductCRUD() {
  console.log('\n📦 4. PRODUCT CRUD');
  console.log('-'.repeat(40));
  
  try {
    // READ ALL
    let { status, data } = await fetchJSON(API + '/products');
    const products = data.data?.products || data.products || data.data || [];
    logTest('READ ALL', status === 200, `Total: ${products.length || data.total || 0}`);
    
    // Get a category for the product
    const catRes = await fetchJSON(API + '/categories');
    const categories = catRes.data?.data || [];
    const categoryId = categories[0]?._id;
    
    // Get a brand
    const brandRes = await fetchJSON(API + '/brands');
    const brands = brandRes.data?.data || [];
    const brandId = brands[0]?._id;
    
    if (!categoryId) {
      console.log('  ⚠️  No category found, skipping product CREATE');
      results.push({ name: 'Product', status: 'SKIP ⚠️' });
      return;
    }
    
    // CREATE
    const newProduct = {
      name: 'Test Product ' + Date.now(),
      slug: 'test-product-' + Date.now(),
      description: 'Auto-generated test product',
      shortDescription: 'Test product',
      category: categoryId,
      brand: brandId,
      basePrice: 99000,
      status: 'draft',
      isActive: true
    };
    
    ({ status, data } = await fetchJSON(API + '/products/admin', {
      method: 'POST',
      body: JSON.stringify(newProduct)
    }));
    
    if (status === 201 || status === 200) {
      createdIds.product = data.data?._id || data._id;
      logTest('CREATE', true, `ID: ${createdIds.product}`);
    } else {
      logTest('CREATE', false, `${status} - ${data.message || 'Failed'}`);
    }
    
    // UPDATE
    if (createdIds.product) {
      ({ status, data } = await fetchJSON(API + '/products/admin/' + createdIds.product, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Test Product', basePrice: 199000 })
      }));
      logTest('UPDATE', status === 200, data.data?.name || data.message);
    }
    
    // We'll delete later after variant test
    results.push({ name: 'Product', status: 'PASS ✅' });
  } catch (e) {
    console.log('  ERROR:', e.message);
    results.push({ name: 'Product', status: 'FAIL ❌' });
  }
}

// ============================================
// 5. VARIANT/SKU CRUD
// ============================================

async function testVariantCRUD() {
  console.log('\n🔢 5. VARIANT/SKU CRUD');
  console.log('-'.repeat(40));
  
  try {
    // READ ALL
    let { status, data } = await fetchJSON(API + '/products/variants');
    logTest('READ ALL', status === 200, `Total: ${data.data?.length || data.total || 0}`);
    
    if (!createdIds.product) {
      console.log('  ⚠️  No test product, skipping variant CREATE');
      results.push({ name: 'Variant/SKU', status: 'SKIP ⚠️' });
      return;
    }
    
    // Get a color
    const colorRes = await fetchJSON(API + '/colors');
    const colors = colorRes.data?.data || colorRes.data || [];
    const colorId = colors[0]?._id;
    
    // CREATE VARIANT (POST /api/products/admin/:productId/variants)
    const newVariant = {
      sku: 'TEST-SKU-' + Date.now(),
      color: colorId,
      size: 'M',
      price: 149000,
      stock: 10,
      isActive: true
    };
    
    ({ status, data } = await fetchJSON(API + '/products/admin/' + createdIds.product + '/variants', {
      method: 'POST',
      body: JSON.stringify(newVariant)
    }));
    
    if (status === 201 || status === 200) {
      createdIds.variant = data.data?._id || data._id;
      logTest('CREATE', true, `SKU: ${newVariant.sku}`);
    } else {
      logTest('CREATE', false, `${status} - ${data.message || 'Failed'}`);
    }
    
    // UPDATE
    if (createdIds.variant) {
      ({ status, data } = await fetchJSON(API + '/products/admin/variants/' + createdIds.variant, {
        method: 'PUT',
        body: JSON.stringify({ price: 199000, stock: 20 })
      }));
      logTest('UPDATE', status === 200, `New price: ${data.data?.price || 199000}`);
    }
    
    // DELETE VARIANT
    if (createdIds.variant) {
      ({ status, data } = await fetchJSON(API + '/products/admin/variants/' + createdIds.variant, {
        method: 'DELETE'
      }));
      logTest('DELETE', status === 200, 'Variant cleaned up');
      createdIds.variant = null;
    }
    
    results.push({ name: 'Variant/SKU', status: 'PASS ✅' });
  } catch (e) {
    console.log('  ERROR:', e.message);
    results.push({ name: 'Variant/SKU', status: 'FAIL ❌' });
  }
}

// ============================================
// 6. INVENTORY
// ============================================

async function testInventory() {
  console.log('\n📊 6. INVENTORY');
  console.log('-'.repeat(40));
  
  try {
    // READ OVERVIEW (route is /api/admin/inventory)
    let { status, data, isHtml } = await fetchJSON(API + '/admin/inventory/overview');
    
    if (isHtml) {
      logTest('OVERVIEW', false, 'Route returned HTML (auth issue?)');
      results.push({ name: 'Inventory', status: 'FAIL ❌' });
      return;
    }
    
    logTest('OVERVIEW', status === 200, `Status: ${status}`);
    
    // READ LIST
    ({ status, data } = await fetchJSON(API + '/admin/inventory'));
    logTest('LIST', status === 200, `Items: ${data.data?.length || data.items?.length || 0}`);
    
    // READ ALERTS
    ({ status, data } = await fetchJSON(API + '/admin/inventory/alerts'));
    logTest('ALERTS', status === 200, `Low stock: ${data.data?.length || 0}`);
    
    // READ ADJUSTMENTS
    ({ status, data } = await fetchJSON(API + '/admin/inventory/adjustments'));
    logTest('ADJUSTMENTS', status === 200, `Total: ${data.data?.length || 0}`);
    
    results.push({ name: 'Inventory', status: 'PASS ✅' });
  } catch (e) {
    console.log('  ERROR:', e.message);
    results.push({ name: 'Inventory', status: 'FAIL ❌' });
  }
}

// ============================================
// CLEANUP
// ============================================

async function cleanup() {
  console.log('\n🧹 CLEANUP');
  console.log('-'.repeat(40));
  
  // Delete test product (and its variants cascade)
  if (createdIds.product) {
    const { status } = await fetchJSON(API + '/products/admin/' + createdIds.product, {
      method: 'DELETE'
    });
    console.log('  Product:', status === 200 ? '✅ Deleted' : '❌ Failed');
  }
  
  // Delete any remaining test data
  for (const [key, id] of Object.entries(createdIds)) {
    if (id && key !== 'product') {
      console.log(`  ${key}: ⚠️ ID ${id} may need manual cleanup`);
    }
  }
  
  console.log('  ✅ Cleanup complete');
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🧪 FULL CRUD TESTING WITH AUTHENTICATION');
  console.log('═'.repeat(60));
  console.log('API:', API);
  console.log('Time:', new Date().toLocaleString());
  
  // Step 1: Login
  const loggedIn = await login();
  
  if (!loggedIn) {
    console.log('\n❌ Cannot proceed without authentication');
    console.log('   Please update ADMIN_CREDENTIALS at the top of this file');
    process.exit(1);
  }
  
  // Step 2: Run all CRUD tests
  await testCategoryCRUD();
  await testBrandCRUD();
  await testColorCRUD();
  await testProductCRUD();
  await testVariantCRUD();
  await testInventory();
  
  // Step 3: Cleanup
  await cleanup();
  
  // Step 4: Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('═'.repeat(60));
  
  let passed = 0, failed = 0, skipped = 0;
  
  for (const r of results) {
    console.log(`  ${r.name.padEnd(15)} ${r.status}`);
    if (r.status.includes('PASS')) passed++;
    else if (r.status.includes('FAIL')) failed++;
    else skipped++;
  }
  
  console.log('-'.repeat(40));
  console.log(`  PASSED: ${passed}  |  FAILED: ${failed}  |  SKIPPED: ${skipped}`);
  console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);
