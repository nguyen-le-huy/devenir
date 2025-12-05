import { openai, MODELS } from '../../../config/openai.js';
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
        const response = await openai.chat.completions.create({
            model: MODELS.CHAT,
            messages,
            temperature: 0.3,
            max_tokens: 800,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('LLM Generation Error:', error);
        throw new Error('Failed to generate response');
    }
}

/**
 * Generate streaming response (for real-time chat)
 * @param {string} query - User query
 * @param {string} context - Context from RAG retrieval
 * @param {Function} onChunk - Callback for each chunk
 */
export async function generateStreamingResponse(query, context, onChunk) {
    const systemPrompt = buildCoVePrompt(context);

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
    ];

    try {
        const stream = await openai.chat.completions.create({
            model: MODELS.CHAT,
            messages,
            temperature: 0.3,
            max_tokens: 800,
            stream: true
        });

        let fullResponse = '';

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            fullResponse += content;
            if (onChunk) {
                onChunk(content);
            }
        }

        return fullResponse;
    } catch (error) {
        console.error('Streaming Generation Error:', error);
        throw new Error('Failed to generate streaming response');
    }
}

/**
 * Generate JSON response (for structured outputs)
 */
export async function generateJsonResponse(prompt, schema = null) {
    const messages = [
        { role: 'user', content: prompt }
    ];

    try {
        const response = await openai.chat.completions.create({
            model: MODELS.CHAT,
            messages,
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        console.error('JSON Generation Error:', error);
        throw new Error('Failed to generate JSON response');
    }
}
