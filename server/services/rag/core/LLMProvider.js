import { openai, MODELS } from '../../../config/openai.js';

/**
 * LLM Provider wrapper for OpenAI
 */
export class LLMProvider {
    constructor() {
        this.client = openai;
    }

    /**
     * Generate chat completion
     */
    async chatCompletion(messages, options = {}) {
        const {
            model = MODELS.CHAT,
            temperature = 0.3,
            maxTokens = 800,
            responseFormat = null
        } = options;

        const completionOptions = {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        };

        if (responseFormat) {
            completionOptions.response_format = responseFormat;
        }

        const response = await this.client.chat.completions.create(completionOptions);
        return response.choices[0].message.content;
    }

    /**
     * Generate JSON response (uses fast model, returns parsed JSON)
     */
    async jsonCompletion(messages, options = {}) {
        const content = await this.chatCompletion(messages, {
            ...options,
            model: MODELS.CHAT_FAST,
            responseFormat: { type: 'json_object' }
        });
        return JSON.parse(content);
    }

    /**
     * Fast completion for classification
     */
    async fastCompletion(messages, options = {}) {
        return this.chatCompletion(messages, {
            ...options,
            model: MODELS.CHAT_FAST,
            temperature: 0.1
        });
    }

    /**
     * Generate embeddings
     */
    async embed(text, dimensions = 1536) {
        const response = await this.client.embeddings.create({
            model: MODELS.EMBEDDING,
            input: text,
            dimensions
        });

        return response.data[0].embedding;
    }

    /**
     * Generate batch embeddings
     */
    async embedBatch(texts, dimensions = 1536) {
        const response = await this.client.embeddings.create({
            model: MODELS.EMBEDDING,
            input: texts,
            dimensions
        });

        return response.data.map(item => item.embedding);
    }
}

// Export singleton instance
export const llmProvider = new LLMProvider();
