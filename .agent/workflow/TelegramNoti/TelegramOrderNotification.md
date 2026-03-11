---
description: Workflow gửi thông báo đơn hàng thành công lên Telegram qua n8n
---

# 📦 Telegram Order Notification Workflow

Hướng dẫn tích hợp hệ thống gửi thông báo đơn hàng thành công lên Telegram thông qua n8n.

---

## 📋 Tổng quan

Khi user thanh toán thành công (PayOS hoặc NowPayments), hệ thống sẽ tự động:
1. Backend gọi n8n webhook với thông tin đơn hàng
2. n8n format và gửi tin nhắn lên Telegram group/channel

---

## 🔄 LUỒNG HOẠT ĐỘNG

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  BACKEND        │      │       n8n       │      │    TELEGRAM     │
│  (Express)      │      │  (Self-hosted)  │      │    (Bot API)    │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │  1. Payment Success    │                        │
         │  Webhook nhận xác nhận │                        │
         │                        │                        │
         │  2. POST /webhook/...  │                        │
         │ ─────────────────────► │                        │
         │  {order data}          │                        │
         │                        │  3. Format message     │
         │                        │  + Send to Telegram    │
         │                        │ ─────────────────────► │
         │                        │                        │
         │  4. Response           │                        │
         │ ◄───────────────────── │                        │
         │  {success: true}       │                        │
```

---

## 📁 CẤU TRÚC FILE

### **Backend Server** (`/server/`)
| File | Mô tả |
|------|-------|
| `controllers/PaymentController.js` | Xử lý webhook payment, gọi n8n sau khi payment success |
| `services/telegram/telegramNotification.js` | Helper function gọi n8n webhook |

### **n8n Workflow**
| STT | Node | Mô tả |
|-----|------|-------|
| 1 | Webhook | Nhận request từ Backend Server |
| 2 | Code (Format Message) | Format tin nhắn đẹp với emoji |
| 3 | Telegram (Send Message) | Gửi tin nhắn lên group/channel |
| 4 | Respond to Webhook | Trả kết quả về Backend |

---

## 📋 CHI TIẾT TỪNG NODE TRONG n8n

### **Node 1: Webhook**
- **HTTP Method**: POST
- **Path**: `order-notification` (hoặc tên bạn muốn)
- **Response Mode**: `Using 'Respond to Webhook' Node`

### **Node 2: Code (Format Message)**
- **Mode**: Run Once for All Items
- **Code**:

```javascript
const order = $input.first().json;

// Format items list
const itemsList = order.items.map((item, idx) => 
  `  ${idx + 1}. ${item.name}\n     • Màu: ${item.color} | Size: ${item.size}\n     • SL: ${item.quantity} x $${item.price}`
).join('\n\n');

// Format shipping address
const address = order.shippingAddress;
const fullAddress = `${address.street}, ${address.city}`;

// Format payment method
const paymentEmoji = order.paymentGateway === 'PayOS' ? '🏦' : '₿';

// Build message
const message = `
🎉 <b>ĐƠN HÀNG MỚI!</b>

📦 <b>Mã đơn:</b> <code>#${order.orderCode}</code>
💰 <b>Tổng tiền:</b> <b>$${order.totalPrice}</b>
${paymentEmoji} <b>Thanh toán:</b> ${order.paymentGateway}

👤 <b>Khách hàng:</b>
• Email: ${order.customerEmail}
• SĐT: ${address.phone}

📍 <b>Địa chỉ:</b>
${fullAddress}

🛍️ <b>Sản phẩm:</b>
${itemsList}

🚚 <b>Giao hàng:</b> ${order.deliveryWindow === 'standard' ? 'Tiêu chuẩn (2-3 ngày)' : order.deliveryWindow === 'next' ? 'Ngày hôm sau' : 'Chọn ngày'}

⏰ ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
`.trim();

return {
  json: {
    chatId: order.telegramChatId || $env.TELEGRAM_CHAT_ID,
    text: message
  }
};
```

### **Node 3: Telegram (Send Message)**
- **Credential**: Telegram API (Bot token từ BotFather)
- **Operation**: Send Message
- **Chat ID**: `{{ $json.chatId }}`
- **Text**: `{{ $json.text }}`
- **Parse Mode**: HTML

### **Node 4: Respond to Webhook**
- **Response Body**:
```json
{
  "success": true,
  "message": "Notification sent to Telegram"
}
```

---

## ⚙️ BACKEND INTEGRATION

### **1. Tạo file helper** (`/server/services/telegram/telegramNotification.js`)

```javascript
import axios from 'axios';
import logger from '../../config/logger.js';

const N8N_WEBHOOK_URL = process.env.N8N_ORDER_NOTIFICATION_WEBHOOK;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ORDER_CHAT_ID;

/**
 * Send order notification to Telegram via n8n
 * @param {Object} order - Order document from MongoDB
 */
export async function sendOrderNotificationToTelegram(order) {
  if (!N8N_WEBHOOK_URL) {
    logger.warn('N8N_ORDER_NOTIFICATION_WEBHOOK not configured, skipping Telegram notification');
    return;
  }

  try {
    const payload = {
      orderCode: order.paymentIntent?.gatewayOrderCode || order._id,
      totalPrice: order.totalPrice,
      paymentGateway: order.paymentGateway,
      customerEmail: order.user?.email || 'N/A',
      shippingAddress: order.shippingAddress,
      deliveryWindow: order.deliveryWindow,
      items: order.orderItems.map(item => ({
        name: item.name,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price: item.price
      })),
      telegramChatId: TELEGRAM_CHAT_ID
    };

    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    logger.info('Telegram notification sent successfully', {
      orderCode: payload.orderCode,
      response: response.data
    });

    return response.data;
  } catch (error) {
    logger.error('Failed to send Telegram notification', {
      orderCode: order.paymentIntent?.gatewayOrderCode,
      error: error.message
    });
    // Don't throw - this is a non-critical operation
  }
}
```

### **2. Thêm vào PaymentController.js**

Trong `handlePayOSWebhook` và `handleNowPaymentsWebhook`, sau khi `order.save()`:

```javascript
import { sendOrderNotificationToTelegram } from '../services/telegram/telegramNotification.js';

// ... existing code ...

// After order is marked as paid and saved
await order.save();

// Send Telegram notification (non-blocking)
sendOrderNotificationToTelegram(order).catch(err => {
  logger.error('Telegram notification failed', { error: err.message });
});

return res.status(200).json({ success: true });
```

### **3. Thêm Environment Variables** (`.env`)

```env
# Telegram Order Notification
N8N_ORDER_NOTIFICATION_WEBHOOK=https://your-n8n.com/webhook/order-notification
TELEGRAM_ORDER_CHAT_ID=-1001234567890
```

---

## 🔧 CẤU HÌNH TELEGRAM

### **1. Tạo Bot**
1. Chat với [@BotFather](https://t.me/BotFather) trên Telegram
2. Gửi `/newbot` và làm theo hướng dẫn
3. Lưu **Bot Token** (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### **2. Lấy Chat ID**
- **Group**: Add bot vào group → gửi tin nhắn → truy cập:
  `https://api.telegram.org/bot<TOKEN>/getUpdates`
  → Lấy `chat.id` (số âm cho group, ví dụ: `-1001234567890`)
  
- **Channel**: Forward tin nhắn từ channel đến [@userinfobot](https://t.me/userinfobot)

### **3. Thêm Credential trong n8n**
1. Settings → Credentials → Add Credential
2. Chọn **Telegram API**
3. Paste **Access Token** (Bot Token)

---

## 📝 PAYLOAD MẪU

Backend gửi đến n8n webhook:

```json
{
  "orderCode": "1734567890123",
  "totalPrice": 125.50,
  "paymentGateway": "PayOS",
  "customerEmail": "customer@example.com",
  "shippingAddress": {
    "street": "123 Nguyen Van A, Quan 1",
    "city": "Ho Chi Minh",
    "phone": "0901234567"
  },
  "deliveryWindow": "standard",
  "items": [
    {
      "name": "Cashmere Bomber Jacket",
      "color": "Navy",
      "size": "M",
      "quantity": 1,
      "price": 120.00
    }
  ],
  "telegramChatId": "-1001234567890"
}
```

---

## 📱 TIN NHẮN MẪU TRÊN TELEGRAM

```
🎉 ĐƠN HÀNG MỚI!

📦 Mã đơn: #1734567890123
💰 Tổng tiền: $125.50
🏦 Thanh toán: PayOS

👤 Khách hàng:
• Email: customer@example.com
• SĐT: 0901234567

📍 Địa chỉ:
123 Nguyen Van A, Quan 1, Ho Chi Minh

🛍️ Sản phẩm:
  1. Cashmere Bomber Jacket
     • Màu: Navy | Size: M
     • SL: 1 x $120.00

🚚 Giao hàng: Tiêu chuẩn (2-3 ngày)

⏰ 15/12/2025, 11:00:00
```

---

## 🔧 XỬ LÝ LỖI

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| Webhook không nhận được | URL sai hoặc workflow chưa Active | Kiểm tra URL (bỏ `-test`), bật Activate |
| Bot không gửi được tin | Chat ID sai hoặc bot chưa được add | Verify chat ID, add bot vào group |
| Timeout | n8n server chậm | Tăng timeout, check n8n logs |
| Missing fields | Order data không đầy đủ | Populate đầy đủ trước khi gửi |

---

## ✅ TESTING

### Test thủ công với curl:
```bash
curl -X POST https://your-n8n.com/webhook/order-notification \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": "TEST123",
    "totalPrice": 99.99,
    "paymentGateway": "PayOS",
    "customerEmail": "test@example.com",
    "shippingAddress": {
      "street": "Test Address",
      "city": "Test City",
      "phone": "0123456789"
    },
    "deliveryWindow": "standard",
    "items": [{"name": "Test Product", "color": "Red", "size": "M", "quantity": 1, "price": 99.99}],
    "telegramChatId": "-1001234567890"
  }'
```

---

## 📝 GHI CHÚ

1. **Non-blocking**: Telegram notification không block payment flow. Nếu fail, order vẫn được xử lý bình thường.

2. **Logging**: Mọi lỗi đều được log để debug.

3. **Production URL**: Nhớ dùng URL Production của n8n webhook (không có `-test`).

4. **Bot permissions**: Bot phải được add vào group/channel và có quyền gửi tin nhắn.
