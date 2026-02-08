
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Order from '../../../models/OrderModel.js';
import User from '../../../models/UserModel.js';
import Product from '../../../models/ProductModel.js';
import ProductVariant from '../../../models/ProductVariantModel.js';
import { llmProvider } from '../core/LLMProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function adminAnalytics(query, extractedInfo, context) {
    // SECURITY CHECK: Only admins can access this service
    if (context.customerProfile?.role !== 'admin') {
        console.warn(`🛑 Unauthorized Admin Analytics Attempt by: ${context.customerProfile?.email}`);
        return {
            answer: "Xin lỗi, bạn cần quyền Quản trị viên (Admin) để tra cứu các thông tin vận hành nhạy cảm này.",
            intent: 'unauthorized_access'
        };
    }

    try {
        // 1. Determine specifically what the admin wants using LLM
        // We use a small LLM call to classify the specific admin task
        const adminIntent = await classifyAdminIntent(query, context.recent_messages || []);
        console.log('Admin Intent:', adminIntent);

        let data = {};
        let systemPrompt = '';

        switch (adminIntent.type) {
            case 'revenue':
                data = await getRevenueData(adminIntent);
                systemPrompt = `Bạn là trợ lý Admin. Hãy báo cáo doanh thu dựa trên dữ liệu sau: ${JSON.stringify(data)}. 
            - Luôn định dạng tiền tệ là VNĐ hoặc đ (ví dụ: 1.000.000 đ).
            - Nếu không có doanh thu, hãy nói rõ.`;
                break;

            case 'customer_lookup':
                data = await getCustomerData(adminIntent.target); // email or phone
                systemPrompt = `Bạn là trợ lý Admin. Đây là thông tin khách hàng: ${JSON.stringify(data)}. 
            - Tổng hợp thông tin về chi tiêu (đơn vị: VNĐ/đ), lịch sử đơn hàng và loyalty tier.
            - Liệt kê địa chỉ nếu có.`;
                break;

            case 'customer_stats':
                const userCount = await User.countDocuments();
                data = { totalUsers: userCount };
                systemPrompt = `Bạn là trợ lý Admin. Hiện tại hệ thống có ${userCount} người dùng (user). Hãy thông báo con số này cho admin.`;
                break;

            case 'order_status':
                data = await getOrderAdminData(adminIntent.target); // order id or tracking
                systemPrompt = `Bạn là trợ lý Admin. Đây là chi tiết đơn hàng: ${JSON.stringify(data)}. 
            - Báo cáo trạng thái, vị trí đơn hàng và thông tin thanh toán (đơn vị: VNĐ/đ).`;
                break;

            case 'product_inventory':
                data = await getProductInventoryData(adminIntent); // pass entire intent extracted from LLM
                systemPrompt = `Bạn là trợ lý Admin. Đây là thông tin kho hàng: ${JSON.stringify(data)}. 
            Báo cáo số lượng tồn kho theo yêu cầu.`;
                break;

            case 'inventory_export':
                data = await generateInventoryCSV(adminIntent);
                systemPrompt = `Bạn là trợ lý Admin. Tôi đã xuất file CSV thành công.
            - Thông báo ngắn gọn cho admin biết file đã sẵn sàng.
            - TUYỆT ĐỐI KHÔNG hiển thị tên file hoặc đường dẫn URL trong tin nhắn text (vì UI đã hiển thị card download rồi).
            - Chỉ nói câu đơn giản như "File báo cáo của bạn đã sẵn sàng dưới đây."`;
                break;
            case 'revenue_export':
                data = await generateRevenueCSV(adminIntent);
                systemPrompt = `Bạn là trợ lý Admin. Tôi đã xuất file CSV thành công.
            - Thông báo ngắn gọn cho admin biết file đã sẵn sàng.
            - TUYỆT ĐỐI KHÔNG hiển thị tên file hoặc đường dẫn URL trong tin nhắn text (vì UI đã hiển thị card download rồi).
            - Chỉ nói câu đơn giản như "File báo cáo của bạn đã sẵn sàng dưới đây."`;
                break;

            case 'customer_export':
                data = await generateCustomerCSV();
                systemPrompt = `Bạn là trợ lý Admin. Tôi đã xuất danh sách khách hàng thành công.
            - Thông báo ngắn gọn cho admin biết file đã sẵn sàng.
            - TUYỆT ĐỐI KHÔNG hiển thị tên file hoặc đường dẫn URL trong tin nhắn text (vì UI đã hiển thị card download rồi).
             - Chỉ nói câu đơn giản như "Danh sách khách hàng của bạn đã sẵn sàng dưới đây."`;
                break;

            default:
                return {
                    answer: "Tôi có thể giúp bạn tra cứu: Doanh thu (hôm nay, tuần này), Thông tin khách hàng, Trạng thái đơn hàng, và Tồn kho sản phẩm.",
                    type: 'general'
                };
        }

        // 2. Generate natural language response
        const response = await llmProvider.chatCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
        ], { temperature: 0.2 });

        return {
            answer: response,
            data: data,
            intent: `admin_${adminIntent.type}`
        };
    } catch (error) {
        console.error('Admin Analytics Error:', error);
        return {
            answer: `Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu: ${error.message}`,
            intent: 'error'
        };
    }
}

// --- Helper: Classify Admin Intent ---
async function classifyAdminIntent(query, history = []) {
    // 0. Quick Keyword Check for Export
    const lowerQuery = query.toLowerCase();

    // Priority 1: Revenue Export (Check this FIRST to avoid falling into generic export)
    if (lowerQuery.includes('doanh thu') && (lowerQuery.includes('báo cáo') || lowerQuery.includes('xuất') || lowerQuery.includes('export') || lowerQuery.includes('csv'))) {
        // Let the LLM extract the specific period/dates, pass through to LLM for full extraction
        // OR return partial intent to force a specific path if we want to bypass LLM 
        // But since we need startDate/endDate calculation, and that logic is in LLM prompt or we'd need to duplicate it here...
        // Actually, we can return type 'revenue_export' and let LLM fill details? 
        // No, classifyAdminIntent is THE place that returns the result. 
        // If we return early here, we skip LLM extraction of dates.

        // Strategy: If keyword detected, we still want LLM to extract dates, BUT we need to make sure LLM knows it's revenue_export.
        // The prompt handles "revenue_export" classification.
        // The issue is the Quick Check below forces 'inventory_export' if it sees "xuất báo cáo".

        // FIX: Do NOTHING here, let it fall through to LLM (which has revenue_export instructions).
        // OR: Return special trigger?

        // Actually, the block below catches "xuất báo cáo" and forces inventory_export.
        // So we just need to return null/continue if it's revenue related.
    }

    // Priority 2: Customer Export (Check this SECOND)
    else if (lowerQuery.includes('user') && (lowerQuery.includes('danh sách') || lowerQuery.includes('xuất') || lowerQuery.includes('list'))) {
        // Fallthrough to LLM for classification
    }

    // Priority 3: Inventory Export (Generic "export" or "inventory export")
    // Improved detection: "csv", "export", "xuất file", "xuất báo cáo", "tải", "download"
    else if (lowerQuery.includes('csv') || lowerQuery.includes('export') || lowerQuery.includes('xuất file') || lowerQuery.includes('xuất báo cáo') || lowerQuery.includes('tải') || lowerQuery.includes('download') || (lowerQuery.includes('báo cáo') && lowerQuery.includes('kho'))) {
        let scope = 'all';

        // A. Explicit scope in current query
        if (lowerQuery.includes('low') || lowerQuery.includes('thấp') || lowerQuery.includes('sắp hết') || lowerQuery.includes('cảnh báo') || lowerQuery.includes('warning')) scope = 'low_stock';
        else if (lowerQuery.includes('out') || lowerQuery.includes('hết hàng')) scope = 'out_of_stock';
        else {
            // B. Implicit scope from context (history)
            // Look at the last user message to see if they were asking about stock
            // specific keywords in LAST USER message
            const lastUserMsg = [...history].reverse().find(m => m.role === 'user');
            if (lastUserMsg) {
                const lowerLastContent = lastUserMsg.content.toLowerCase();
                if (lowerLastContent.includes('sắp hết') || lowerLastContent.includes('low') || lowerLastContent.includes('thấp')) {
                    scope = 'low_stock';
                    console.log('Context inferred scope: low_stock');
                } else if (lowerLastContent.includes('hết hàng') || lowerLastContent.includes('out')) {
                    scope = 'out_of_stock';
                    console.log('Context inferred scope: out_of_stock');
                }
            }
        }

        return { type: 'inventory_export', scope };
    }

    const now = new Date();
    // Build History Context
    let historyContext = "";
    if (history && history.length > 0) {
        // Take last 3 messages for context
        const recentMessages = history.slice(-3);
        historyContext = recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }

    const prompt = `
    Current Date: ${now.toISOString()}
    
    Conversation History:
    ${historyContext}
    
    Phân loại yêu cầu của admin thành các loại sau:
    - revenue (doanh thu, doanh số...) 
      -> extract metadata: 
         - period: 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year', 'all', 'custom'
         - startDate: ISOString (calculate based on Current Date if specific time mentioned)
         - endDate: ISOString (calculate based on Current Date if specific time mentioned)
    - customer_lookup (tìm khách, info khách, lịch sử mua...) 
      -> extract metadata: target (email, phone, or name). If name is messy, take the most likely name part.
      -> example: "tìm khách tên Huy" -> target: "Huy"
      -> IMPORTANT: If user says "user đó", "khách này", "nó", "họ" (refers to previous context), look at Conversation History to find the user email/phone/name mentioned previously.
    - customer_stats (số lượng user, bao nhiêu khách hàng, thống kê user...)
      -> extract metadata: none
    - customer_export (tải danh sách user, xuất excel khách hàng, danh sách người dùng...)
      -> extract metadata: none
    - order_status (đơn hàng...) -> extract metadata: target (order code, order id)
      -> Check history if user refers to "đơn hàng đó".
    - product_inventory (kho hàng, tồn kho, check stock, sắp hết, hết hàng) 
      -> extract metadata: 
         - target (product name, sku)
         - status: 'all', 'low_stock', 'out_of_stock' (detect from keywords like "sắp hết", "hết", "cảnh báo")
         - threshold: number (default 10 if "sắp hết" or "low_stock" or "cảnh báo", extract explicit number if present like "dưới 5")
    - inventory_export (xuất file, export csv, báo cáo tồn kho, tải danh sách...)
      -> extract metadata: 
         - scope: 'all', 'low_stock', 'out_of_stock', 'category'
         - category: string (if scope is category)
    - revenue_export (xuất báo cáo doanh thu, export revenue csv...)
      -> extract metadata:
         - period: 'today', 'yesterday', 'this_week', 'this_month', 'this_quarter', 'last_quarter', 'this_year', 'all', 'custom'
         - startDate: ISOString (calculate based on Current Date)
         - endDate: ISOString (calculate based on Current Date)
    
    Query: "${query}"
    
    Return JSON only: { "type": "...", "target": "...", "period": "...", "scope": "...", "status": "...", "threshold": ... }
    `;

    try {
        const result = await llmProvider.jsonCompletion([
            { role: 'user', content: prompt }
        ]);
        return result;
    } catch (e) {
        return { type: 'general' };
    }
}

// --- Helper: Date Calculation ---
function calculateDateRange(params) {
    const { period, startDate: startStr, endDate: endStr } = params;
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    // 1. Priority: Explicit ISO dates from LLM
    if (startStr) {
        startDate = new Date(startStr);
        endDate = endStr ? new Date(endStr) : now;
    }
    // 2. Fallback: Period keywords
    else {
        startDate.setHours(0, 0, 0, 0); // Default to start of today

        switch (period) {
            case 'today':
                // Already set to start of today
                break;
            case 'yesterday':
                startDate.setDate(now.getDate() - 1);
                endDate.setDate(now.getDate() - 1);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
            case 'this_week':
                startDate.setDate(now.getDate() - 7); // Simplified past 7 days
                break;
            case 'last_week':
                startDate.setDate(now.getDate() - 14);
                endDate.setDate(now.getDate() - 7);
                break;
            case 'month':
            case 'this_month':
                startDate.setDate(1);
                break;
            case 'last_month':
                startDate.setMonth(now.getMonth() - 1);
                startDate.setDate(1);
                endDate.setDate(0);
                break;
            case 'quarter':
            case 'this_quarter':
                const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
                startDate.setMonth(quarterStartMonth, 1);
                break;
            case 'last_quarter':
                const currentQuarterStart = Math.floor(now.getMonth() / 3) * 3;
                startDate.setMonth(currentQuarterStart - 3, 1);
                endDate.setMonth(currentQuarterStart, 0);
                break;
            case 'this_year':
            case 'year':
                startDate.setMonth(0, 1);
                break;
            case 'last_year':
                startDate.setFullYear(now.getFullYear() - 1, 0, 1);
                endDate.setFullYear(now.getFullYear() - 1, 11, 31);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'all':
                startDate = new Date(0);
                break;
            default:
                break;
        }
    }
    return { startDate, endDate };
}

// --- 1. Revenue Queries ---
async function getRevenueData(params) {
    const { startDate, endDate } = calculateDateRange(params);
    const { period } = params;

    const stats = await Order.getTotalRevenue(startDate, endDate);

    // Get recent orders for context
    const recentOrders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
    }).limit(5).select('totalPrice status createdAt paymentMethod');

    return {
        period: period || 'custom',
        dateRange: { start: startDate, end: endDate },
        summary: stats,
        recent_transactions: recentOrders
    };
}

// --- 2. Customer Queries ---
async function getCustomerData(target) {
    if (!target) return null;

    // Normalize target
    const searchTarget = target.trim();

    // Build query conditions
    const conditions = [
        { email: { $regex: searchTarget, $options: 'i' } },
        { phone: { $regex: searchTarget, $options: 'i' } },
        { username: { $regex: searchTarget, $options: 'i' } },
        { firstName: { $regex: searchTarget, $options: 'i' } },
        { lastName: { $regex: searchTarget, $options: 'i' } }
    ];

    // If query contains space, attempt to match Full Name (First+Last or Last+First)
    if (searchTarget.includes(' ')) {
        conditions.push({
            $expr: {
                $regexMatch: {
                    input: { $concat: [{ $ifNull: ["$lastName", ""] }, " ", { $ifNull: ["$firstName", ""] }] },
                    regex: searchTarget,
                    options: "i"
                }
            }
        });
        conditions.push({
            $expr: {
                $regexMatch: {
                    input: { $concat: [{ $ifNull: ["$firstName", ""] }, " ", { $ifNull: ["$lastName", ""] }] },
                    regex: searchTarget,
                    options: "i"
                }
            }
        });
    }

    // Find users (could be multiple if searching by name)
    const users = await User.find({ $or: conditions }).limit(5); // Limit to 5 matches

    if (!users || users.length === 0) return { found: false, message: `Không tìm thấy khách hàng nào khớp với "${searchTarget}".` };

    // If more than 1 user found
    if (users.length > 1) {
        return {
            type: 'list_results',
            count: users.length,
            message: `Tìm thấy ${users.length} khách hàng có email khớp với "${target}".`,
            candidates: users.map(u => ({
                id: u._id,
                name: u.username,
                email: u.email,
                phone: u.phone
            }))
        };
    }

    const user = users[0];

    // Get stats for the single user found
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }) || [];
    const totalSpent = orders.reduce((sum, ord) => sum + (['paid', 'shipped', 'delivered'].includes(ord.status) ? (ord.totalPrice || 0) : 0), 0);

    return {
        type: 'detail',
        profile: {
            name: user.username,
            fullName: `${user.lastName || ''} ${user.firstName || ''}`.trim(),
            email: user.email,
            phone: user.phone,
            joinDate: user.createdAt,
            loyalty: user.customerProfile?.loyaltyTier,
            addresses: user.addresses?.map(a => `${a.street}, ${a.district}, ${a.city}`) || []
        },
        stats: {
            totalOrders: orders.length,
            totalSpent: totalSpent,
            lastOrder: orders[0]?.createdAt
        },
        recentOrders: orders.slice(0, 3).map(o => ({
            id: o._id,
            total: o.totalPrice,
            status: (o.status === 'shipped' ? 'Đang giao hàng' :
                o.status === 'delivered' ? 'Đã giao thành công' :
                    o.status === 'paid' ? 'Đã thanh toán' :
                        o.status === 'pending' ? 'Chờ thanh toán' : o.status),
            date: o.createdAt
        }))
    };
}

// --- 3. Order Queries ---
async function getOrderAdminData(target) {
    // Try find by ID or Tracking or Gateway Order ID
    let order = await Order.findOne({
        $or: [
            { _id: target.match(/^[0-9a-fA-F]{24}$/) ? target : null },
            { trackingNumber: target },
            { 'paymentResult.id': target }
        ]
    });

    // If simple search failed, try find by phone in shipping address
    if (!order) {
        order = await Order.findOne({ 'shippingAddress.phone': target }).sort({ createdAt: -1 });
    }

    if (!order) return { found: false };

    return order;
}

// --- 4. Product Inventory Queries ---
// --- 4. Product Inventory Queries ---
async function getProductInventoryData(params) {
    const { target, status, threshold = 10 } = params;

    // A. Specific Product Query
    if (target) {
        // Find product basic info
        const product = await Product.findOne({
            name: { $regex: target, $options: 'i' }
        });

        if (!product) return { found: false, message: `Không tìm thấy sản phẩm nào tên là "${target}"` };

        // Get all variants (stock source of truth)
        const variants = await ProductVariant.find({ product_id: product._id }) || [];

        const totalStock = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
        const totalReserved = variants.reduce((sum, v) => sum + (v.reserved || 0), 0);

        return {
            type: 'specific_product',
            product: {
                name: product.name,
                status: product.status,
                price: variants[0]?.price
            },
            inventory: {
                totalQuantity: totalStock,
                totalReserved: totalReserved,
                variants: variants.map(v => ({
                    color: v.color,
                    size: v.size,
                    stock: v.quantity,
                    reserved: v.reserved,
                    sku: v.sku
                }))
            }
        };
    }

    // B. Low Stock / Out of Stock Scan (Global)
    else if (status === 'low_stock' || status === 'out_of_stock') {
        const queryThreshold = status === 'out_of_stock' ? 0 : threshold;

        // Find variants with quantity <= threshold
        // Populate product to get name
        const lowStockVariants = await ProductVariant.find({
            quantity: { $lte: queryThreshold }
        })
            .limit(20) // Limit to top 20 to avoid token overflow
            .sort({ quantity: 1 }) // Show lowest stock first
            .populate('product_id', 'name status');

        if (!lowStockVariants.length) {
            return {
                type: 'scan_result',
                found: false,
                message: `Hiện tại kho hàng đang hoạt động tốt, chưa ghi nhận sản phẩm nào ${status === 'out_of_stock' ? 'hết hàng' : `có số lượng dưới ${queryThreshold}`}.`
            };
        }

        return {
            type: 'scan_result',
            criteria: status,
            threshold: queryThreshold,
            count: lowStockVariants.length,
            items: lowStockVariants.map(v => ({
                productName: v.product_id?.name || 'Unknown Product',
                sku: v.sku,
                color: v.color,
                size: v.size,
                stock: v.quantity,
                reserved: v.reserved
            }))
        };
    }

    // C. Fallback: General Summary? Or ask for specific name
    return {
        found: false,
        message: "Vui lòng cung cấp tên sản phẩm cụ thể hoặc yêu cầu xem hàng sắp hết."
    };
}

// --- 5. Inventory Export (CSV) ---
async function generateInventoryCSV(params) {
    const { scope, category } = params;
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `inventory_export_${timestamp}.csv`;
    const exportDir = path.join(__dirname, '../../../public/exports');
    const filePath = path.join(exportDir, filename);

    // Ensure directory exists (redundant if using mkdir -p but good for safety)
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    let variants = [];

    // Filter logic
    let filter = {};
    if (scope === 'low_stock') {
        filter.quantity = { $lte: 10 };


    } else if (scope === 'out_of_stock') {
        filter.quantity = 0;
    }

    // Get variants with product info
    let query = ProductVariant.find(filter).populate('product_id', 'name category status');

    // Sort by low stock if scoping for it
    if (scope === 'low_stock' || scope === 'out_of_stock') {
        query = query.sort({ quantity: 1 });
    } else {
        query = query.sort({ 'product_id.name': 1 });
    }

    const results = await query.exec();

    // Secondary filter for category if needed (since category is on Product, easier to filter in JS or aggregate, 
    // but JS filter is fine for MVP volume)
    if (category) {
        variants = results.filter(v =>
            v.product_id?.category?.toString() === category ||
            v.product_id?.category?.name?.toLowerCase().includes(category.toLowerCase()) // Assuming category might be populated or ID
        );
    } else {
        variants = results;
    }

    // Build CSV Content
    const header = [
        'Product Name',
        'SKU',
        'Color',
        'Size',
        'Stock Quantity',
        'Reserved',
        'Status'
    ].join(',');

    const rows = variants.map(v => {
        const pName = v.product_id?.name || 'Unknown';
        const pStatus = v.product_id?.status || 'Active';
        // handle commas in name
        const safeName = pName.includes(',') ? `"${pName}"` : pName;

        return [
            safeName,
            v.sku,
            v.color,
            v.size,
            v.quantity,
            v.reserved,
            pStatus
        ].join(',');
    });

    const csvContent = [header, ...rows].join('\n');

    // Write file
    fs.writeFileSync(filePath, csvContent);

    // Return attachment info
    return {
        type: 'file_generated',
        count: variants.length,
        attachment: {
            name: filename,
            type: 'csv',
            url: `${process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.devenir.shop' : 'http://localhost:3111')}/exports/${filename}`
        }
    };
}

// --- 6. Revenue Export (CSV) ---
async function generateRevenueCSV(params) {
    const { startDate, endDate } = calculateDateRange(params);
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `revenue_export_${timestamp}.csv`;
    const exportDir = path.join(__dirname, '../../../public/exports');
    const filePath = path.join(exportDir, filename);

    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    // Query orders
    const orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
    })
        .populate('user', 'username email phone')
        .sort({ createdAt: -1 });

    const header = [
        'Order ID',
        'Date',
        'Customer Name',
        'Customer Phone',
        'Total Amount (VND)',
        'Payment Method',
        'Payment Status',
        'Order Status'
    ].join(',');

    const rows = orders.map(order => {
        const orderDate = new Date(order.createdAt).toLocaleString('vi-VN');
        const customerName = order.user?.username || 'Guest';
        const phone = order.shippingAddress?.phone || order.user?.phone || 'N/A';
        const total = order.totalPrice || 0;

        return [
            order._id,
            `"${orderDate}"`,
            `"${customerName}"`,
            `"${phone}"`,
            total,
            order.paymentMethod,
            order.isPaid ? 'Paid' : 'Unpaid',
            order.status
        ].join(',');
    });

    const csvContent = [header, ...rows].join('\n');
    fs.writeFileSync(filePath, csvContent);

    const apiBaseUrl = process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.devenir.shop' : 'http://localhost:3111');
    const fileUrl = `${apiBaseUrl}/exports/${filename}`;

    const count = orders.length;
    let periodText = 'tùy chỉnh';
    if (params.period) periodText = params.period;

    return {
        type: 'file_generated',
        count: count,
        message: `Đã xuất báo cáo doanh thu (${periodText}). Tìm thấy ${count} đơn hàng.`,
        attachment: {
            name: filename,
            type: 'csv',
            url: fileUrl
        }
    };
}

// --- 7. Customer Export (CSV) ---
async function generateCustomerCSV() {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });

        if (!users || users.length === 0) {
            return {
                type: 'text',
                answer: 'Hiện tại chưa có người dùng nào trong hệ thống.'
            };
        }

        // CSV Header
        const header = ['User ID', 'Name', 'Email', 'Phone', 'Role', 'Join Date', 'Total Orders', 'Total Spent (VND)'];
        const rows = [];

        // Optimize: Aggregate query on Orders to group by user
        const orderStats = await Order.aggregate([
            {
                $group: {
                    _id: '$user',
                    totalSpent: { $sum: '$totalPrice' },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        // Map stats for quick lookup
        const statsMap = {};
        orderStats.forEach(stat => {
            if (stat._id) statsMap[stat._id.toString()] = stat;
        });

        for (const user of users) {
            const stats = statsMap[user._id.toString()] || { totalSpent: 0, orderCount: 0 };
            // Safe name handling
            let name = user.username || user.email || 'N/A';
            if (name.includes(',')) name = `"${name}"`;

            const row = [
                user._id,
                name,
                user.email || 'N/A',
                user.phone || 'N/A',
                user.role || 'customer',
                user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A',
                stats.orderCount,
                stats.totalSpent
            ];
            rows.push(row.join(','));
        }

        const csvContent = [header.join(','), ...rows].join('\n');

        // Ensure directory exists
        const exportDir = path.join(__dirname, '../../../public/exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const timestamp = Date.now();
        const filename = `customer_list_${timestamp}.csv`;
        const filePath = path.join(exportDir, filename);

        // Add BOM for Excel compatibility
        fs.writeFileSync(filePath, '\ufeff' + csvContent, 'utf8');

        const apiBaseUrl = process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.devenir.shop' : 'http://localhost:3111');
        const fileUrl = `${apiBaseUrl}/exports/${filename}`;

        return {
            type: 'file_generated',
            count: users.length,
            attachment: {
                name: 'customer_list.csv',
                type: 'csv',
                url: fileUrl
            }
        };

    } catch (error) {
        console.error('Error generating Customer CSV:', error);
        throw error;
    }
}
