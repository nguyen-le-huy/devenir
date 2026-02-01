import EventEmitter from 'events';
import EventLog from '../models/EventLogModel.js';
import User from '../models/UserModel.js';
import Order from '../models/OrderModel.js';
import jwt from 'jsonwebtoken';

class EventService extends EventEmitter {
    constructor() {
        super();
        this.setupListeners();
    }

    // --- Listeners Setup ---
    setupListeners() {
        this.on('product_view', this.handleProductView.bind(this));
        this.on('add_to_cart', this.handleAddToCart.bind(this));
        this.on('purchase', this.handlePurchase.bind(this));
        this.on('search', this.handleSearch.bind(this));
        this.on('filter_apply', this.handleFilterApply.bind(this));
        this.on('chat_message', this.handleChatMessage.bind(this));
        this.on('wishlist_add', this.handleWishlistAdd.bind(this));
    }

    // --- Helper Methods (Internal) ---
    async _addTag(userId, tag) {
        try {
            await User.findByIdAndUpdate(userId, { $addToSet: { 'customerProfile.tags': tag } }, { new: true });
        } catch (error) {
            console.error('addTag error:', error);
        }
    }

    async _addNote(userId, noteData) {
        try {
            const user = await User.findById(userId).lean();
            const existingNotes = user?.customerProfile?.notesList || [];

            const isDuplicate = existingNotes.some(note =>
                note.type === noteData.type &&
                note.content.toLowerCase().includes(noteData.content.toLowerCase().substring(0, 20))
            );

            if (isDuplicate) return;

            await User.findByIdAndUpdate(userId, {
                $push: {
                    'customerProfile.notesList': {
                        ...noteData,
                        createdBy: 'system',
                        createdAt: new Date(),
                        isPinned: false,
                    },
                },
            });
        } catch (error) {
            console.error('addNote error:', error);
        }
    }

    // --- Core Logic ---

    /**
     * Track Batch Events
     */
    async trackEvents(userId, events) {
        const eventDocs = events.map((event) => ({
            userId,
            sessionId: event.sessionId,
            type: event.type,
            data: event.data || {},
            timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
            page: event.page,
            referrer: event.referrer,
        }));

        await EventLog.insertMany(eventDocs);

        // Async Processing
        setImmediate(() => {
            events.forEach((event) => {
                this.emit(event.type, {
                    userId,
                    data: event.data || {},
                    timestamp: event.timestamp,
                });
            });
        });

        return events.length;
    }

    /**
     * Track Single Event (Beacon)
     */
    async trackSingleEvent(payload, userAgent, ip) {
        const { type, data, timestamp, token } = payload;

        let userId = data?.userId || null;

        if (token && !userId) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId || decoded.id;
            } catch (err) {
                // Ignore token error
            }
        }

        await EventLog.create({
            userId: userId || null,
            type,
            data: data || {},
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            sessionId: data?.sessionId || null,
            userAgent,
            ipAddress: ip,
        });

        console.log(`✅ [Event] ${type} - User: ${userId || 'anonymous'}`);
        return true;
    }

    /**
     * Get Events Stats
     */
    async getUserEventStats(userId, days = 30) {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const stats = await EventLog.aggregate([
            { $match: { userId, timestamp: { $gte: startDate } } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        return stats;
    }

    // --- Event Handlers (Business Logic for Side Effects) ---

    async handleProductView({ userId, data }) {
        if (userId === 'anonymous') return;
        try {
            const { productId, category, productName } = data; // Ensure productName is extracted

            const viewCount = await EventLog.countDocuments({
                userId, type: 'product_view', 'data.category': category,
                timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            });

            if (viewCount >= 5) await this._addTag(userId, `interested:${category}`);

            const productViewCount = await EventLog.countDocuments({
                userId, type: 'product_view', 'data.productId': productId,
                timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            });

            if (productViewCount >= 3) {
                await this._addNote(userId, { type: 'opportunity', content: `Xem sản phẩm ${productName || 'này'} nhiều lần - Quan tâm cao nhưng chưa mua` });
            }
        } catch (error) { console.error('handleProductView error:', error); }
    }

    async handleAddToCart({ userId, data }) {
        if (userId === 'anonymous') return;
        try {
            const { product } = data;
            const { category, brand, color, size } = product || {}; // Safety check

            if (category) await this._addTag(userId, `browsing:${category}`);
            if (color) await this._addTag(userId, `color:${color.toLowerCase()}`);
            if (size) await this._addTag(userId, `size:${size}`);
            if (brand) await this._addTag(userId, `brand:${brand.toLowerCase()}`);
        } catch (error) { console.error('handleAddToCart error:', error); }
    }

    async handlePurchase({ userId, data }) {
        if (userId === 'anonymous') return;
        try {
            const { items } = data;
            // Simplified logic placeholder - can invoke specialized analysis methods here

            await User.findByIdAndUpdate(userId, {
                $pull: { 'customerProfile.tags': { $regex: /^browsing:/ } },
            });
        } catch (error) { console.error('handlePurchase error:', error); }
    }

    async handleSearch({ userId, data }) {
        if (userId === 'anonymous') return;
        try {
            const { query } = data;
            const recentSearches = await EventLog.find({
                userId, type: 'search', timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }).sort('-timestamp').limit(10).lean();

            const similar = recentSearches.filter(s => s.data.query?.toLowerCase().includes(query.toLowerCase()));
            if (similar.length >= 3) {
                await this._addNote(userId, { type: 'opportunity', content: `Tìm kiếm "${query}" nhiều lần - Cần tư vấn hoặc sản phẩm không đủ` });
            }
        } catch (error) { console.error('handleSearch error:', error); }
    }

    async handleFilterApply({ userId, data }) {
        if (userId === 'anonymous') return;
        try {
            const { filters } = data;
            if (filters.brand) await this._addTag(userId, `brand:${filters.brand.toLowerCase()}`);
            if (filters.category) await this._addTag(userId, `category:${filters.category.toLowerCase()}`);
        } catch (error) { console.error('handleFilterApply error:', error); }
    }

    async handleChatMessage({ userId, data }) {
        if (userId === 'anonymous') return;
        try {
            const { intent } = data;
            if (intent === 'size_recommendation') await this._addTag(userId, 'needs:size-help');
            if (intent === 'product_advice') await this._addTag(userId, 'needs:consultation');
            if (intent === 'style_matching') await this._addTag(userId, 'needs:styling-advice');
        } catch (error) { console.error('handleChatMessage error:', error); }
    }

    async handleWishlistAdd({ userId, data }) {
        if (userId === 'anonymous') return;
        try {
            const wishlistCount = await EventLog.countDocuments({
                userId, type: 'wishlist_add', timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            });

            if (wishlistCount > 5) {
                const purchaseCount = await Order.countDocuments({
                    user: userId, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                });
                if (purchaseCount === 0) {
                    await this._addNote(userId, { type: 'opportunity', content: 'Nhiều wishlist nhưng chưa mua - Có thể do giá hoặc cần voucher' });
                    await this._addTag(userId, 'behavior:wishlist-saver');
                }
            }
        } catch (error) { console.error('handleWishlistAdd error:', error); }
    }
}

export default new EventService();
