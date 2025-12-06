import { llmProvider } from '../core/LLMProvider.js';
import { buildCoVePrompt } from './prompt-builder.js';

/**
 * Generate response using LLM
 * @param {string} query - User query
 * @param {string} context - Context from RAG retrieval
 * @param {Array} conversationHistory - Previous messages
 */
export async function generateResponse(query, context, conversationHistory = []) {
    const systemPrompt = buildCoVePrompt(context, conversationHistory);

    // Build messages array
    const messages = [
        { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (last 4 messages for context)
    if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-4);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        }
    }

    // Add current query
    messages.push({ role: 'user', content: query });

    try {
        return await llmProvider.chatCompletion(messages, {
            temperature: 0.3,
            maxTokens: 800
        });
    } catch (error) {
        console.error('LLM Generation Error:', error);
        throw new Error('Failed to generate response');
    }
}
