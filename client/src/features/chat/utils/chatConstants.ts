/**
 * Chat Feature Constants
 * Centralized configuration for chat module
 */

// Storage Keys
export const CHAT_STORAGE_KEY = 'devenir_chat_session';
export const GUEST_SESSION_KEY = 'chat_session_id';

// Message Limits
export const MAX_CONVERSATION_HISTORY = 50;
export const DEFAULT_HISTORY_LIMIT = 20;
export const MAX_MESSAGE_LENGTH = 1000;

// Rate Limiting
export const MAX_MESSAGES_PER_MINUTE = 10;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// Animation Speeds (ms)
export const STREAMING_SPEED_MS = 12;
export const STREAMING_CHARS_PER_FRAME = 2;
export const ANIMATION_DURATION_MS = 300;

// React Query Configuration
export const CHAT_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const CHAT_CACHE_TIME = 10 * 60 * 1000; // 10 minutes

// Query Keys Factory
export const CHAT_QUERY_KEYS = {
  all: ['chat'] as const,
  messages: ['chat', 'messages'] as const,
  history: (limit: number) => ['chat', 'history', limit] as const,
  health: ['chat', 'health'] as const,
} as const;

// Intent Types
export const CHAT_INTENTS = {
  SIZE_HELP: 'size-help',
  PRODUCT_RECOMMENDATION: 'product-recommendation',
  STYLING_ADVICE: 'styling-advice',
  ORDER_INQUIRY: 'order-inquiry',
  CONSULTATION: 'consultation',
  GENERAL: 'general',
} as const;

// Error Messages
export const CHAT_ERRORS = {
  NETWORK_ERROR: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
  RATE_LIMIT: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi một chút.',
  MESSAGE_TOO_LONG: `Tin nhắn quá dài. Vui lòng giới hạn trong ${MAX_MESSAGE_LENGTH} ký tự.`,
  EMPTY_MESSAGE: 'Vui lòng nhập tin nhắn.',
} as const;

// Success Messages
export const CHAT_SUCCESS = {
  ADDED_TO_CART: 'Đã thêm vào giỏ hàng!',
  HISTORY_CLEARED: 'Đã xóa lịch sử chat.',
} as const;
