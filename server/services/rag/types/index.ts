/**
 * RAG Service Type Definitions
 * Enterprise-grade type safety for AI-powered chat system
 * 
 * @module RAGTypes
 * @version 1.0.0
 */

// ============================================
// MESSAGE & CONVERSATION TYPES
// ============================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface IMessage {
    role: MessageRole;
    content: string;
    timestamp?: Date;
    metadata?: IMessageMetadata;
}

export interface IMessageMetadata {
    intent?: string;
    confidence?: number;
    suggested_products?: IProductSummary[];
    suggested_action?: ISuggestedAction;
    sources?: ISearchSource[];
    [key: string]: unknown;
}

export interface IConversationContext {
    conversation_id: string;
    history: IMessage[];
    recent_messages: IMessage[];
    recent_product_id?: string;
    entities?: IExtractedEntities;
    intent_history?: string[];
    summary?: string;
    turn_count?: number;
    conversation_age?: number;
    has_entities?: boolean;
}

// ============================================
// ENTITY EXTRACTION TYPES
// ============================================

export interface IExtractedEntities {
    current_product: IProductEntity | null;
    all_products: IProductEntity[];
    user_measurements: IUserMeasurements;
    preferences: IUserPreferences;
    conversation_topic: ConversationTopic;
    intent_history?: string[];
}

export interface IProductEntity {
    name: string;
    id?: string;
    mentioned_at?: string;
    full_data?: IProductData;
}

export interface IUserMeasurements {
    height?: number;
    weight?: number;
    chest?: number;
    waist?: number;
    shoulder?: number;
    usual_size?: string;
}

export interface IUserPreferences {
    colors?: string[];
    style?: string;
    budget?: IBudgetRange;
    fit_preference?: 'slim' | 'regular' | 'relaxed';
}

export interface IBudgetRange {
    min?: number;
    max?: number;
}

export type ConversationTopic =
    | 'product_search'
    | 'size_inquiry'
    | 'style_advice'
    | 'order_tracking'
    | 'general'
    | 'policy_faq'
    | 'admin_analytics';

// ============================================
// INTENT CLASSIFICATION TYPES
// ============================================

export type IntentType =
    | 'product_advice'
    | 'size_recommendation'
    | 'style_matching'
    | 'order_lookup'
    | 'policy_faq'
    | 'add_to_cart'
    | 'admin_analytics'
    | 'general';

export interface IIntentResult {
    intent: IntentType;
    confidence: number;
    extracted_info: IExtractedInfo;
}

export interface IExtractedInfo {
    product_type?: string;
    material?: string;
    color?: string;
    size?: string;
    height?: number;
    weight?: number;
    style?: string;
    budget?: number;
    occasion?: string;
    is_followup?: boolean;
    product_id?: string;
    order_number?: string;
    [key: string]: unknown;
}

// ============================================
// RAG SERVICE TYPES
// ============================================

export interface IRAGRequest {
    userId: string;
    message: string;
    conversationHistory: IMessage[];
}

export interface IRAGResponse {
    intent: IntentType;
    confidence: number;
    answer: string;
    conversation_id?: string;
    sources?: ISearchSource[];
    suggested_products?: IProductSummary[];
    suggested_action?: ISuggestedAction;
    size_recommendation?: ISizeRecommendation;
    metadata?: Record<string, unknown>;
}

export interface ISearchSource {
    product_id: string;
    product_name: string;
    score: number;
    proposition_text?: string;
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface IProductData {
    _id: string;
    name: string;
    urlSlug: string;
    description?: string;
    category?: ICategoryData;
    price?: number;
    minPrice?: number;
    maxPrice?: number;
    images?: string[];
    isActive: boolean;
}

export interface ICategoryData {
    _id: string;
    name: string;
    slug?: string;
}

export interface IProductSummary {
    _id: string;
    name: string;
    urlSlug?: string;
    variantId?: string;
    mainImage?: string;
    price?: number;
    minPrice?: number;
    maxPrice?: number;
}

export interface IProductVariant {
    _id: string;
    product_id: string;
    size: string;
    color: string;
    price: number;
    quantity: number;
    mainImage?: string;
    isActive: boolean;
}

// ============================================
// SIZE RECOMMENDATION TYPES
// ============================================

export interface ISizeRecommendation {
    recommended_size: string;
    confidence?: number;
    reason?: string;
    reasoning?: ISizeReasoning;
    alternative_size?: string | null;
    alternative_reasoning?: string;
    specific_advice?: string[];
    fit_note?: string;
    try_both_recommendation?: 'Yes' | 'No';
    measurement_request?: IMeasurementRequest;
    confidence_factors?: IConfidenceFactors;
}

export interface ISizeReasoning {
    primary_factor?: string;
    material_consideration?: string;
    fit_outcome?: string;
    chart_alignment?: string;
}

export interface IMeasurementRequest {
    needed: string[];
    reason: string;
}

export interface IConfidenceFactors {
    measurement_completeness: number;
    chart_match_clarity: number;
    material_certainty: number;
    overall_confidence: number;
}

// ============================================
// SUGGESTED ACTION TYPES
// ============================================

export type SuggestedActionType = 'add_to_cart' | 'view_product' | 'contact_support';

export interface ISuggestedAction {
    type: SuggestedActionType;
    prompt: string;
    product?: IProductSummary;
    variant_id?: string;
}

// ============================================
// PRODUCT KNOWLEDGE TYPES
// ============================================

export interface IProductKnowledge {
    product_id: string;
    product_name: string;

    // Material Intelligence
    material: string;
    materialType: 'natural' | 'synthetic' | 'blend';
    hasStretch: boolean;
    stretchPercentage: number;
    breathability: 'low' | 'medium' | 'high' | 'very_high';
    warmth: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

    // Fit Intelligence
    fitType: string;
    fitTolerance: 'exact_size' | 'true_to_size' | 'size_up_if_between' | 'flexible';
    criticalMeasurement: string;
    sizingAdvice: string;
    fitFeedback?: string;

    // Care & Maintenance
    careInstructions: string;
    shrinkage: string;
    durability: 'low' | 'medium_to_low' | 'medium' | 'medium_to_high' | 'high';
    careComplexity: 'low' | 'medium' | 'high';

    // Style Intelligence
    styleCategory: string;
    seasonality: 'Spring/Summer' | 'Fall/Winter' | 'Transitional (Spring/Fall)' | 'All-season';
    formality: 'casual' | 'smart_casual' | 'formal';
    versatility: 'low' | 'medium' | 'high';

    // Designer/Brand Notes
    specialNotes?: string | null;
    designerIntent?: string;

    // Quality Indicators
    pricePoint: 'accessible' | 'mid_range' | 'premium' | 'luxury';
    qualityTier: 'standard' | 'premium' | 'luxury';

    // Metadata
    generated_at: Date;
    confidence: number;
}

// ============================================
// ADMIN ANALYTICS TYPES
// ============================================

export type AdminIntentType =
    | 'revenue'
    | 'customer_lookup'
    | 'customer_stats'
    | 'product_inventory'
    | 'order_status'
    | 'inventory_export'
    | 'revenue_export'
    | 'customer_export';

export interface IAdminIntentParams {
    type: AdminIntentType;
    target?: string;
    period?: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';
    startDate?: string;
    endDate?: string;
    status?: 'low_stock' | 'out_of_stock' | 'all';
    threshold?: number;
    scope?: 'all' | 'low_stock' | 'out_of_stock';
}

export interface IRevenueData {
    total: number;
    orderCount: number;
    averageOrderValue: number;
    recentOrders: IOrderSummary[];
    period: string;
}

export interface IOrderSummary {
    _id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: Date;
}

export interface ICustomerData {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    totalSpent: number;
    orderCount: number;
    loyaltyTier?: string;
    addresses?: IAddress[];
}

export interface IAddress {
    street: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
}

export interface IInventoryData {
    productId: string;
    productName: string;
    variants: IVariantStock[];
    totalStock: number;
    lowStockCount: number;
}

export interface IVariantStock {
    variantId: string;
    size: string;
    color: string;
    quantity: number;
    isLowStock: boolean;
}

// ============================================
// LLM PROVIDER TYPES
// ============================================

export interface ILLMCompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' } | null;
}

export interface ILLMUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

// ============================================
// VECTOR SEARCH TYPES
// ============================================

export interface IVectorSearchOptions {
    topK?: number;
    namespace?: string;
    filter?: Record<string, unknown>;
    minScore?: number;
    includeMetadata?: boolean;
}

export interface IVectorSearchResult {
    id: string;
    score: number;
    metadata: IVectorMetadata;
}

export interface IVectorMetadata {
    product_id: string;
    product_name: string;
    proposition_text?: string;
    category?: string;
    [key: string]: unknown;
}

// ============================================
// CACHE TYPES
// ============================================

export interface ICacheOptions {
    ttl?: number;
    prefix?: string;
}

export interface ICacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

// ============================================
// COLOR MATCHING TYPES
// ============================================

export interface IColorMatch {
    vi: string;
    en: string;
    isCompound?: boolean;
}

// ============================================
// CUSTOMER CONTEXT TYPES
// ============================================

export interface ICustomerProfile {
    role: 'user' | 'admin';
    customerType?: 'new' | 'returning' | 'vip';
    preferences?: IUserPreferences;
    purchaseHistory?: IPurchaseHistorySummary;
}

export interface IPurchaseHistorySummary {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    frequentCategories: string[];
    frequentColors: string[];
    frequentSizes: string[];
}

export interface ICustomerContext {
    hasContext: boolean;
    contextString: string;
    userProfile?: ICustomerProfile;
    intelligence?: ICustomerIntelligence;
}

export interface ICustomerIntelligence {
    engagementScore: number;
    churnRisk: 'low' | 'medium' | 'high';
    recommendedApproach: string;
}

// All types are already exported at their declaration points
