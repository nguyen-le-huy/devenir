/**
 * RAG Metrics Collection
 * Prometheus-compatible metrics for monitoring and observability
 * 
 * @module RAGMetrics
 * @version 1.0.0
 */

import logger from '../utils/logger.js';

// ============================================
// METRIC TYPES
// ============================================

/**
 * Simple Counter implementation
 */
class Counter {
    constructor(name, help, labelNames = []) {
        this.name = name;
        this.help = help;
        this.labelNames = labelNames;
        this.values = new Map();
    }

    inc(labels = {}, value = 1) {
        const key = this._getLabelKey(labels);
        const current = this.values.get(key) || 0;
        this.values.set(key, current + value);
    }

    get(labels = {}) {
        const key = this._getLabelKey(labels);
        return this.values.get(key) || 0;
    }

    reset() {
        this.values.clear();
    }

    _getLabelKey(labels) {
        if (this.labelNames.length === 0) {
            return 'default';
        }
        return this.labelNames.map(name => labels[name] || '').join(':');
    }

    collect() {
        const metrics = [];
        this.values.forEach((value, key) => {
            metrics.push({ labels: key, value });
        });
        return { name: this.name, help: this.help, type: 'counter', metrics };
    }
}

/**
 * Simple Gauge implementation
 */
class Gauge {
    constructor(name, help, labelNames = []) {
        this.name = name;
        this.help = help;
        this.labelNames = labelNames;
        this.values = new Map();
    }

    set(labels = {}, value) {
        const key = this._getLabelKey(labels);
        this.values.set(key, value);
    }

    inc(labels = {}, value = 1) {
        const key = this._getLabelKey(labels);
        const current = this.values.get(key) || 0;
        this.values.set(key, current + value);
    }

    dec(labels = {}, value = 1) {
        this.inc(labels, -value);
    }

    get(labels = {}) {
        const key = this._getLabelKey(labels);
        return this.values.get(key) || 0;
    }

    _getLabelKey(labels) {
        if (this.labelNames.length === 0) {
            return 'default';
        }
        return this.labelNames.map(name => labels[name] || '').join(':');
    }

    collect() {
        const metrics = [];
        this.values.forEach((value, key) => {
            metrics.push({ labels: key, value });
        });
        return { name: this.name, help: this.help, type: 'gauge', metrics };
    }
}

/**
 * Simple Histogram implementation
 */
class Histogram {
    constructor(name, help, options = {}) {
        this.name = name;
        this.help = help;
        this.labelNames = options.labelNames || [];
        this.buckets = options.buckets || [0.1, 0.5, 1, 2, 5, 10];
        this.values = new Map();
    }

    observe(labels = {}, value) {
        const key = this._getLabelKey(labels);

        if (!this.values.has(key)) {
            this.values.set(key, {
                sum: 0,
                count: 0,
                buckets: this.buckets.reduce((acc, b) => {
                    acc[b] = 0;
                    return acc;
                }, {})
            });
        }

        const entry = this.values.get(key);
        entry.sum += value;
        entry.count += 1;

        for (const bucket of this.buckets) {
            if (value <= bucket) {
                entry.buckets[bucket] += 1;
            }
        }
    }

    get(labels = {}) {
        const key = this._getLabelKey(labels);
        const entry = this.values.get(key);

        if (!entry) {
            return { sum: 0, count: 0, mean: 0 };
        }

        return {
            sum: entry.sum,
            count: entry.count,
            mean: entry.count > 0 ? entry.sum / entry.count : 0,
            buckets: entry.buckets
        };
    }

    reset() {
        this.values.clear();
    }

    _getLabelKey(labels) {
        if (this.labelNames.length === 0) {
            return 'default';
        }
        return this.labelNames.map(name => labels[name] || '').join(':');
    }

    collect() {
        const metrics = [];
        this.values.forEach((entry, key) => {
            metrics.push({
                labels: key,
                sum: entry.sum,
                count: entry.count,
                mean: entry.count > 0 ? entry.sum / entry.count : 0,
                buckets: entry.buckets
            });
        });
        return { name: this.name, help: this.help, type: 'histogram', metrics };
    }
}

// ============================================
// RAG METRICS
// ============================================

/**
 * RAG Service Metrics Collection
 */
class RAGMetrics {
    constructor() {
        // Request metrics
        this.requestsTotal = new Counter(
            'rag_requests_total',
            'Total RAG requests processed',
            ['intent', 'status']
        );

        this.requestDuration = new Histogram(
            'rag_request_duration_seconds',
            'RAG request duration in seconds',
            { labelNames: ['intent'], buckets: [0.1, 0.5, 1, 2, 5, 10] }
        );

        this.activeRequests = new Gauge(
            'rag_active_requests',
            'Currently active RAG requests'
        );

        // LLM metrics
        this.llmRequestsTotal = new Counter(
            'rag_llm_requests_total',
            'Total LLM API requests',
            ['model', 'operation', 'status']
        );

        this.llmTokensTotal = new Counter(
            'rag_llm_tokens_total',
            'Total LLM tokens consumed',
            ['type'] // prompt, completion
        );

        this.llmDuration = new Histogram(
            'rag_llm_duration_seconds',
            'LLM request duration in seconds',
            { labelNames: ['model'], buckets: [0.5, 1, 2, 5, 10, 30] }
        );

        // Cache metrics
        this.cacheHits = new Counter(
            'rag_cache_hits_total',
            'Total cache hits',
            ['cache_type'] // intent, vector, knowledge
        );

        this.cacheMisses = new Counter(
            'rag_cache_misses_total',
            'Total cache misses',
            ['cache_type']
        );

        // Vector search metrics
        this.vectorSearchCount = new Counter(
            'rag_vector_search_total',
            'Total vector searches performed'
        );

        this.vectorSearchDuration = new Histogram(
            'rag_vector_search_duration_seconds',
            'Vector search duration in seconds',
            { buckets: [0.05, 0.1, 0.25, 0.5, 1] }
        );

        this.vectorResultsCount = new Histogram(
            'rag_vector_results_count',
            'Number of results returned from vector search',
            { buckets: [0, 5, 10, 20, 50] }
        );

        // Intent metrics
        this.intentClassifications = new Counter(
            'rag_intent_classifications_total',
            'Total intent classifications',
            ['intent', 'method'] // keyword, llm, hybrid
        );

        this.intentConfidence = new Histogram(
            'rag_intent_confidence',
            'Intent classification confidence distribution',
            { labelNames: ['intent'], buckets: [0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1] }
        );

        // Context metrics
        this.contextRetrieval = new Counter(
            'rag_context_retrieval_total',
            'Total context retrievals',
            ['has_entities']
        );

        // Error metrics
        this.errorsTotal = new Counter(
            'rag_errors_total',
            'Total errors',
            ['error_code', 'operation']
        );

        // Business metrics
        this.sizeRecommendations = new Counter(
            'rag_size_recommendations_total',
            'Total size recommendations',
            ['recommended_size', 'has_measurements']
        );

        this.adminQueries = new Counter(
            'rag_admin_queries_total',
            'Total admin analytics queries',
            ['query_type']
        );

        logger.info('RAG Metrics initialized');
    }

    // ============================================
    // RECORDING METHODS
    // ============================================

    /**
     * Record a RAG request
     * @param {string} intent - Detected intent
     * @param {string} status - Request status (success/error)
     * @param {number} durationMs - Request duration in milliseconds
     */
    recordRequest(intent, status, durationMs) {
        this.requestsTotal.inc({ intent, status });
        this.requestDuration.observe({ intent }, durationMs / 1000);
    }

    /**
     * Record LLM request
     * @param {string} model - Model used
     * @param {string} operation - Operation type
     * @param {string} status - Request status
     * @param {number} durationMs - Duration in milliseconds
     * @param {Object} usage - Token usage { prompt_tokens, completion_tokens }
     */
    recordLLMRequest(model, operation, status, durationMs, usage = {}) {
        this.llmRequestsTotal.inc({ model, operation, status });
        this.llmDuration.observe({ model }, durationMs / 1000);

        if (usage.prompt_tokens) {
            this.llmTokensTotal.inc({ type: 'prompt' }, usage.prompt_tokens);
        }
        if (usage.completion_tokens) {
            this.llmTokensTotal.inc({ type: 'completion' }, usage.completion_tokens);
        }
    }

    /**
     * Record cache operation
     * @param {string} cacheType - Cache type (intent, vector, knowledge)
     * @param {boolean} hit - Whether cache was hit
     */
    recordCacheOperation(cacheType, hit) {
        if (hit) {
            this.cacheHits.inc({ cache_type: cacheType });
        } else {
            this.cacheMisses.inc({ cache_type: cacheType });
        }
    }

    /**
     * Record vector search
     * @param {number} durationMs - Search duration in milliseconds
     * @param {number} resultCount - Number of results
     */
    recordVectorSearch(durationMs, resultCount) {
        this.vectorSearchCount.inc();
        this.vectorSearchDuration.observe({}, durationMs / 1000);
        this.vectorResultsCount.observe({}, resultCount);
    }

    /**
     * Record intent classification
     * @param {string} intent - Classified intent
     * @param {number} confidence - Confidence score
     * @param {string} method - Classification method (keyword/llm/hybrid)
     */
    recordIntentClassification(intent, confidence, method) {
        this.intentClassifications.inc({ intent, method });
        this.intentConfidence.observe({ intent }, confidence);
    }

    /**
     * Record context retrieval
     * @param {boolean} hasEntities - Whether entities were found
     */
    recordContextRetrieval(hasEntities) {
        this.contextRetrieval.inc({ has_entities: hasEntities ? 'true' : 'false' });
    }

    /**
     * Record an error
     * @param {string} errorCode - Error code
     * @param {string} operation - Operation that failed
     */
    recordError(errorCode, operation) {
        this.errorsTotal.inc({ error_code: errorCode, operation });
    }

    /**
     * Record size recommendation
     * @param {string} recommendedSize - Recommended size
     * @param {boolean} hasMeasurements - Whether user provided measurements
     */
    recordSizeRecommendation(recommendedSize, hasMeasurements) {
        this.sizeRecommendations.inc({
            recommended_size: recommendedSize,
            has_measurements: hasMeasurements ? 'true' : 'false'
        });
    }

    /**
     * Record admin query
     * @param {string} queryType - Query type (revenue, inventory, etc.)
     */
    recordAdminQuery(queryType) {
        this.adminQueries.inc({ query_type: queryType });
    }

    /**
     * Increment active requests
     */
    incActiveRequests() {
        this.activeRequests.inc();
    }

    /**
     * Decrement active requests
     */
    decActiveRequests() {
        this.activeRequests.dec();
    }

    // ============================================
    // COLLECTION METHODS
    // ============================================

    /**
     * Get all metrics as JSON
     * @returns {Object} All metrics
     */
    getMetrics() {
        return {
            requests: this.requestsTotal.collect(),
            requestDuration: this.requestDuration.collect(),
            activeRequests: this.activeRequests.collect(),
            llmRequests: this.llmRequestsTotal.collect(),
            llmTokens: this.llmTokensTotal.collect(),
            llmDuration: this.llmDuration.collect(),
            cacheHits: this.cacheHits.collect(),
            cacheMisses: this.cacheMisses.collect(),
            vectorSearch: this.vectorSearchCount.collect(),
            vectorDuration: this.vectorSearchDuration.collect(),
            vectorResults: this.vectorResultsCount.collect(),
            intents: this.intentClassifications.collect(),
            intentConfidence: this.intentConfidence.collect(),
            context: this.contextRetrieval.collect(),
            errors: this.errorsTotal.collect(),
            sizeRecommendations: this.sizeRecommendations.collect(),
            adminQueries: this.adminQueries.collect()
        };
    }

    /**
     * Get summary statistics
     * @returns {Object} Summary stats
     */
    getSummary() {
        const requestStats = this.requestDuration.collect();
        const llmStats = this.llmDuration.collect();

        const totalRequests = this._sumCounter(this.requestsTotal);
        const successRequests = this._countByLabel(this.requestsTotal, 'status', 'success');
        const errorRequests = this._countByLabel(this.requestsTotal, 'status', 'error');

        const cacheHits = this._sumCounter(this.cacheHits);
        const cacheMisses = this._sumCounter(this.cacheMisses);
        const cacheTotal = cacheHits + cacheMisses;

        return {
            requests: {
                total: totalRequests,
                success: successRequests,
                errors: errorRequests,
                successRate: totalRequests > 0
                    ? ((successRequests / totalRequests) * 100).toFixed(2) + '%'
                    : 'N/A'
            },
            latency: {
                avgMs: this._getHistogramMean(requestStats) * 1000,
                p95Ms: 'N/A' // Would need percentile calculation
            },
            cache: {
                hits: cacheHits,
                misses: cacheMisses,
                hitRate: cacheTotal > 0
                    ? ((cacheHits / cacheTotal) * 100).toFixed(2) + '%'
                    : 'N/A'
            },
            llm: {
                totalRequests: this._sumCounter(this.llmRequestsTotal),
                promptTokens: this.llmTokensTotal.get({ type: 'prompt' }),
                completionTokens: this.llmTokensTotal.get({ type: 'completion' }),
                avgLatencyMs: this._getHistogramMean(llmStats) * 1000
            },
            topIntents: this._getTopLabels(this.intentClassifications, 5)
        };
    }

    /**
     * Format metrics as Prometheus text
     * @returns {string} Prometheus-format metrics
     */
    toPrometheusFormat() {
        const lines = [];
        const metrics = this.getMetrics();

        for (const [name, metric] of Object.entries(metrics)) {
            lines.push(`# HELP ${metric.name} ${metric.help}`);
            lines.push(`# TYPE ${metric.name} ${metric.type}`);

            for (const m of metric.metrics) {
                const labels = m.labels !== 'default' ? `{labels="${m.labels}"}` : '';

                if (metric.type === 'histogram') {
                    lines.push(`${metric.name}_sum${labels} ${m.sum || 0}`);
                    lines.push(`${metric.name}_count${labels} ${m.count || 0}`);
                } else {
                    lines.push(`${metric.name}${labels} ${m.value || 0}`);
                }
            }
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.requestsTotal = new Counter('rag_requests_total', '', ['intent', 'status']);
        this.requestDuration.reset();
        this.cacheHits = new Counter('rag_cache_hits_total', '', ['cache_type']);
        this.cacheMisses = new Counter('rag_cache_misses_total', '', ['cache_type']);
        this.errorsTotal = new Counter('rag_errors_total', '', ['error_code', 'operation']);

        logger.info('RAG Metrics reset');
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    _sumCounter(counter) {
        let sum = 0;
        counter.values.forEach(value => {
            sum += value;
        });
        return sum;
    }

    _countByLabel(counter, labelName, labelValue) {
        let count = 0;
        counter.values.forEach((value, key) => {
            if (key.includes(labelValue)) {
                count += value;
            }
        });
        return count;
    }

    _getHistogramMean(histogramData) {
        if (!histogramData.metrics || histogramData.metrics.length === 0) {
            return 0;
        }

        let totalSum = 0;
        let totalCount = 0;

        for (const m of histogramData.metrics) {
            totalSum += m.sum || 0;
            totalCount += m.count || 0;
        }

        return totalCount > 0 ? totalSum / totalCount : 0;
    }

    _getTopLabels(counter, limit = 5) {
        const entries = [];
        counter.values.forEach((value, key) => {
            entries.push({ label: key, count: value });
        });

        return entries
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const ragMetrics = new RAGMetrics();
export { Counter, Gauge, Histogram };
