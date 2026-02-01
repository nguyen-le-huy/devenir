/**
 * Chat validation utilities
 * Input sanitization and validation for security and UX
 */

import { MAX_MESSAGE_LENGTH, CHAT_ERRORS } from './chatConstants';

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - Raw user input
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
    if (!input) return '';

    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');

    // Remove script tags and their content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
};

/**
 * Validate message before sending
 * @param message - User message
 * @returns Validation result with error message if invalid
 */
export const validateMessage = (message: string): { valid: boolean; error?: string } => {
    const sanitized = sanitizeInput(message);

    // Check if empty
    if (!sanitized || sanitized.length === 0) {
        return { valid: false, error: CHAT_ERRORS.EMPTY_MESSAGE };
    }

    // Check length
    if (sanitized.length > MAX_MESSAGE_LENGTH) {
        return { valid: false, error: CHAT_ERRORS.MESSAGE_TOO_LONG };
    }

    return { valid: true };
};

/**
 * Rate limiter for chat messages
 * Prevents spam by tracking message timestamps
 */
export class ChatRateLimiter {
    private timestamps: number[] = [];
    private maxMessages: number;
    private windowMs: number;

    constructor(maxMessages: number, windowMs: number) {
        this.maxMessages = maxMessages;
        this.windowMs = windowMs;
    }

    /**
     * Check if user can send a message
     * @returns true if allowed, false if rate limited
     */
    canSend(): boolean {
        const now = Date.now();

        // Remove old timestamps outside the window
        this.timestamps = this.timestamps.filter(
            (timestamp) => now - timestamp < this.windowMs
        );

        // Check if under limit
        if (this.timestamps.length >= this.maxMessages) {
            return false;
        }

        // Add current timestamp
        this.timestamps.push(now);
        return true;
    }

    /**
     * Reset the rate limiter
     */
    reset(): void {
        this.timestamps = [];
    }

    /**
     * Get remaining messages in current window
     */
    getRemainingMessages(): number {
        const now = Date.now();
        this.timestamps = this.timestamps.filter(
            (timestamp) => now - timestamp < this.windowMs
        );
        return Math.max(0, this.maxMessages - this.timestamps.length);
    }
}

/**
 * Escape markdown special characters for safe rendering
 * @param text - Text to escape
 * @returns Escaped text
 */
export const escapeMarkdown = (text: string): string => {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/\*/g, '\\*')
        .replace(/_/g, '\\_')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
};

/**
 * Parse bold text markers (**text**) safely
 * @param text - Text with bold markers
 * @returns Array of text parts with bold flags
 */
export const parseBoldText = (text: string): Array<{ text: string; bold: boolean }> => {
    const parts: Array<{ text: string; bold: boolean }> = [];
    const regex = /(\*\*.*?\*\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push({
                text: text.slice(lastIndex, match.index),
                bold: false,
            });
        }

        // Add bold text (remove markers)
        parts.push({
            text: match[0].slice(2, -2),
            bold: true,
        });

        lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push({
            text: text.slice(lastIndex),
            bold: false,
        });
    }

    return parts;
};
