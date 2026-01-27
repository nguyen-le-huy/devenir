import mongoose from 'mongoose';
import ProductVariant from '../models/ProductVariantModel.js';
import InventoryAdjustment from '../models/InventoryAdjustmentModel.js';
import { emitRealtimeEvent } from '../utils/realtimeEmitter.js';
import { toCsv } from '../utils/csvUtils.js';

const HEALTH_STATES = {
    OUT: 'out-of-stock',
    LOW: 'low-stock',
    HEALTHY: 'healthy',
    OVER: 'overstock',
};

class InventoryService {

    // --- Private Helpers ---

    _buildObjectId(value) {
        if (!value) return null;
        if (!mongoose.Types.ObjectId.isValid(value)) return null;
        return new mongoose.Types.ObjectId(value);
    }

    _buildActorName(user) {
        if (!user) return undefined;
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
        return fullName || user.username || user.email;
    }

    _addHealthProjectionStage() {
        return {
            $addFields: {
                lowThresholdSafe: { $ifNull: ['$lowStockThreshold', 10] },
                reorderPointSafe: { $ifNull: ['$reorderPoint', 0] },
                reservedSafe: { $ifNull: ['$reserved', 0] },
                available: {
                    $max: [
                        { $subtract: [{ $ifNull: ['$quantity', 0] }, { $ifNull: ['$reserved', 0] }] },
                        0,
                    ],
                },
                inventoryValue: {
                    $multiply: [{ $ifNull: ['$price', 0] }, { $ifNull: ['$quantity', 0] }],
                },
                healthStatus: {
                    $switch: {
                        branches: [
                            { case: { $eq: [{ $ifNull: ['$quantity', 0] }, 0] }, then: HEALTH_STATES.OUT },
                            {
                                case: {
                                    $and: [
                                        { $gt: [{ $ifNull: ['$quantity', 0] }, 0] },
                                        { $lte: [{ $ifNull: ['$quantity', 0] }, { $ifNull: ['$lowStockThreshold', 10] }] },
                                    ],
                                },
                                then: HEALTH_STATES.LOW,
                            },
                            {
                                case: {
                                    $and: [
                                        { $gt: [{ $ifNull: ['$reorderPoint', 0] }, 0] },
                                        { $gte: [{ $ifNull: ['$quantity', 0] }, { $multiply: [{ $ifNull: ['$reorderPoint', 0] }, 2] }] },
                                    ],
                                },
                                then: HEALTH_STATES.OVER,
                            },
                        ],
                        default: HEALTH_STATES.HEALTHY,
                    },
                },
            },
        };
    }

    _baseInventoryPipeline({ search, category, brand, productStatus }) {
        const pipeline = [
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
        ];

        if (productStatus) pipeline.push({ $match: { 'product.status': productStatus } });

        const categoryId = this._buildObjectId(category);
        if (categoryId) pipeline.push({ $match: { 'product.category': categoryId } });

        const brandId = this._buildObjectId(brand);
        if (brandId) pipeline.push({ $match: { 'product.brand': brandId } });

        if (search) {
            const regex = new RegExp(search, 'i');
            pipeline.push({
                $match: {
                    $or: [
                        { sku: regex },
                        { color: regex },
                        { size: regex },
                        { 'product.name': regex },
                    ],
                },
            });
        }

        pipeline.push(this._addHealthProjectionStage());
        return pipeline;
    }

    // --- Public Methods ---

    async getInventoryOverview() {
        const overviewPipeline = [
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalSkus: { $sum: 1 },
                    totalUnits: { $sum: { $ifNull: ['$quantity', 0] } },
                    reservedUnits: { $sum: { $ifNull: ['$reserved', 0] } },
                    incomingUnits: { $sum: { $ifNull: ['$incoming', 0] } },
                    totalValue: {
                        $sum: { $multiply: [{ $ifNull: ['$price', 0] }, { $ifNull: ['$quantity', 0] }] },
                    },
                    lowStockCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $gt: [{ $ifNull: ['$quantity', 0] }, 0] },
                                        { $lte: [{ $ifNull: ['$quantity', 0] }, { $ifNull: ['$lowStockThreshold', 10] }] },
                                    ],
                                }, 1, 0,
                            ],
                        },
                    },
                    outOfStockCount: { $sum: { $cond: [{ $eq: [{ $ifNull: ['$quantity', 0] }, 0] }, 1, 0] } },
                },
            },
        ];

        const [overview = {}] = await ProductVariant.aggregate(overviewPipeline);

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [outboundStats] = await InventoryAdjustment.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo }, delta: { $lt: 0 } } },
            { $group: { _id: null, totalOutbound: { $sum: { $abs: '$delta' } } } },
        ]);

        const avgDailyOutbound = outboundStats ? outboundStats.totalOutbound / 30 : 0;
        const turnoverRate = overview.totalUnits && avgDailyOutbound
            ? Number(((avgDailyOutbound * 365) / overview.totalUnits).toFixed(2))
            : 0;
        const daysOfSupply = avgDailyOutbound
            ? Number((overview.totalUnits / avgDailyOutbound).toFixed(2))
            : null;

        const recentAdjustments = await InventoryAdjustment.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .select('sku delta reason quantityAfter performedByName note createdAt');

        return {
            totalSkus: overview.totalSkus || 0,
            totalUnits: overview.totalUnits || 0,
            reservedUnits: overview.reservedUnits || 0,
            incomingUnits: overview.incomingUnits || 0,
            totalValue: overview.totalValue || 0,
            lowStockCount: overview.lowStockCount || 0,
            outOfStockCount: overview.outOfStockCount || 0,
            turnoverRate,
            daysOfSupply,
            recentAdjustments,
        };
    }

    async getInventoryList(query) {
        const {
            page = 1, limit = 20, search, category, brand,
            productStatus, stockStatus, sortBy = 'updatedAt', sortOrder = 'desc',
        } = query;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
        const skip = (pageNum - 1) * limitNum;

        const basePipeline = this._baseInventoryPipeline({ search, category, brand, productStatus });
        const statusMatchStage = stockStatus && stockStatus !== 'all' ? [{ $match: { healthStatus: stockStatus } }] : [];

        const sortFieldMap = {
            sku: 'sku', product: 'product.name', quantity: 'quantity', available: 'available',
            value: 'inventoryValue', updatedAt: 'updatedAt',
        };
        const sortField = sortFieldMap[sortBy] || 'updatedAt';
        const direction = sortOrder === 'asc' ? 1 : -1;

        const dataPipeline = [
            ...basePipeline, ...statusMatchStage,
            { $sort: { [sortField]: direction } },
            { $skip: skip }, { $limit: limitNum },
            {
                $project: {
                    _id: 1, sku: 1, color: 1, size: 1, price: 1, quantity: 1,
                    reserved: '$reservedSafe', incoming: '$incoming', available: 1,
                    inventoryValue: 1, lowStockThreshold: '$lowThresholdSafe', binLocation: 1,
                    reorderPoint: '$reorderPointSafe', healthStatus: 1, updatedAt: 1,
                    product: { _id: '$product._id', name: '$product.name', category: '$product.category', brand: '$product.brand' },
                },
            },
        ];

        const countPipeline = [...basePipeline, ...statusMatchStage, { $count: 'total' }];
        const aggregatePipeline = [
            ...basePipeline, ...statusMatchStage,
            {
                $group: {
                    _id: null,
                    totalUnits: { $sum: { $ifNull: ['$quantity', 0] } },
                    totalValue: { $sum: '$inventoryValue' },
                    lowStock: { $sum: { $cond: [{ $eq: ['$healthStatus', HEALTH_STATES.LOW] }, 1, 0] } },
                    outOfStock: { $sum: { $cond: [{ $eq: ['$healthStatus', HEALTH_STATES.OUT] }, 1, 0] } },
                },
            },
        ];

        const [items, totalResult, aggregateResult] = await Promise.all([
            ProductVariant.aggregate(dataPipeline),
            ProductVariant.aggregate(countPipeline),
            ProductVariant.aggregate(aggregatePipeline),
        ]);

        return {
            items,
            pagination: { page: pageNum, limit: limitNum, total: totalResult[0]?.total || 0, pages: Math.ceil((totalResult[0]?.total || 0) / limitNum) || 0 },
            summary: aggregateResult[0] || { totalUnits: 0, totalValue: 0, lowStock: 0, outOfStock: 0 },
        };
    }

    async getInventoryAlerts() {
        const buildAlertPayload = (matchStage, limit = 10, sort) => {
            return ProductVariant.aggregate([
                { $match: { isActive: true } },
                this._addHealthProjectionStage(),
                matchStage,
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product_id',
                        foreignField: '_id',
                        as: 'product',
                    },
                },
                { $unwind: '$product' },
                sort ? { $sort: sort } : { $sort: { updatedAt: -1 } },
                { $limit: limit },
                {
                    $project: {
                        _id: 1, sku: 1, quantity: 1, reserved: '$reservedSafe', available: 1,
                        incoming: '$incoming', lowStockThreshold: '$lowThresholdSafe', binLocation: 1,
                        product: { _id: '$product._id', name: '$product.name', category: '$product.category', brand: '$product.brand' },
                    },
                },
            ]);
        };

        const [lowStock, outOfStock, overstock, reservationIssues] = await Promise.all([
            buildAlertPayload({ $match: { healthStatus: HEALTH_STATES.LOW } }, 15, { quantity: 1 }),
            buildAlertPayload({ $match: { healthStatus: HEALTH_STATES.OUT } }, 15, { updatedAt: -1 }),
            buildAlertPayload({ $match: { healthStatus: HEALTH_STATES.OVER } }, 10, { quantity: -1 }),
            buildAlertPayload({ $match: { $expr: { $gt: [{ $ifNull: ['$reserved', 0] }, { $ifNull: ['$quantity', 0] }] } } }, 10, { reserved: -1 }),
        ]);

        return { lowStock, outOfStock, overstock, reservationIssues };
    }

    async createInventoryAdjustment(user, adjustmentData, request) {
        const {
            variantId, operation, quantity, reason = 'manual',
            note, costPerUnit, sourceType = 'manual', sourceRef, metadata,
        } = adjustmentData;

        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const variant = await ProductVariant.findById(variantId).session(session);
            if (!variant) throw new Error('Variant not found');

            const numericQty = Number(quantity);
            const beforeQty = variant.quantity ?? 0;
            let nextQty = beforeQty;

            if (operation === 'set') {
                if (numericQty < 0) throw new Error('Resulting quantity cannot be negative');
                nextQty = numericQty;
            } else if (operation === 'add') {
                nextQty = beforeQty + numericQty;
            } else {
                nextQty = beforeQty - numericQty;
            }

            if (nextQty < 0) throw new Error('Resulting quantity cannot be negative');

            variant.quantity = nextQty;
            await variant.save({ session });

            const delta = nextQty - beforeQty;
            const costImpact = costPerUnit ? Number(costPerUnit) * delta : undefined;

            const [adjustment] = await InventoryAdjustment.create([{
                variant: variant._id, product: variant.product_id, sku: variant.sku, delta,
                quantityBefore: beforeQty, quantityAfter: nextQty, reason, note, costPerUnit,
                costImpact, performedBy: user?._id, performedByName: this._buildActorName(user),
                sourceType, sourceRef, metadata,
            }], { session });

            await session.commitTransaction();

            const variantWithProduct = await ProductVariant.findById(variant._id)
                .populate('product_id', 'name category brand')
                .lean();

            emitRealtimeEvent(request, 'inventory:adjusted', {
                variantId: variant._id, sku: variant.sku, delta, reason,
            });

            return { variant: variantWithProduct, adjustment };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getInventoryAdjustments(query) {
        const {
            page = 1, limit = 20, search, reason, sourceType, variantId, sku, dateFrom, dateTo,
        } = query;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
        const skip = (pageNum - 1) * limitNum;
        const filter = {};

        if (variantId && mongoose.Types.ObjectId.isValid(variantId)) filter.variant = variantId;
        if (sku) filter.sku = sku.toUpperCase();
        if (reason) filter.reason = reason;
        if (sourceType) filter.sourceType = sourceType;
        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [{ note: regex }, { performedByName: regex }, { sourceRef: regex }, { sku: regex }];
        }
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo);
        }

        const [adjustments, total] = await Promise.all([
            InventoryAdjustment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate('product', 'name').lean(),
            InventoryAdjustment.countDocuments(filter),
        ]);

        return {
            adjustments,
            pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 0 },
        };
    }

    async exportInventory(options) {
        const { columns, reportType, filters = {}, sorting } = options;

        const pipeline = [
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            this._addHealthProjectionStage(),
        ];

        // Apply Report Type specific logic
        if (reportType === 'needs_restock') {
            pipeline.push({
                $match: {
                    healthStatus: { $in: [HEALTH_STATES.LOW, HEALTH_STATES.OUT] },
                },
            });
        } else if (reportType === 'slow_moving') {
            // Heuristic: Updated > 90 days ago and Quantity > 0
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            pipeline.push({
                $match: {
                    updatedAt: { $lt: ninetyDaysAgo },
                    quantity: { $gt: 0 },
                },
            });
        } else if (reportType === 'custom') {
            const statusFilters = filters.statusFilters?.stockStatus;
            if (statusFilters && statusFilters.length > 0) {
                const mappedStatus = statusFilters.map((s) => s.replace('_', '-'));
                pipeline.push({ $match: { healthStatus: { $in: mappedStatus } } });
            }

            if (filters.quantityFilters?.availableOnly) {
                pipeline.push({ $match: { available: { $gt: 0 } } });
            }
        }

        // Sorting
        const sortField = sorting?.field || 'updatedAt';
        const sortOrder = sorting?.order === 'asc' ? 1 : -1;

        const sortMap = {
            inventory: 'quantity',
            available: 'available',
            totalValue: 'inventoryValue',
            unitPrice: 'price',
            lastUpdated: 'updatedAt',
        };
        const dbSortField = sortMap[sortField] || 'updatedAt';

        pipeline.push({ $sort: { [dbSortField]: sortOrder } });

        const items = await ProductVariant.aggregate(pipeline);

        // Column Definitions
        const columnDefinitions = {
            sku: { label: 'SKU', value: (row) => row.sku },
            productName: { label: 'Tên Sản Phẩm', value: (row) => row.product?.name },
            attributes: { label: 'Thuộc Tính', value: (row) => [row.color, row.size].filter(Boolean).join(' - ') },
            inventory: { label: 'Tồn Kho', value: (row) => row.quantity || 0 },
            available: { label: 'Khả Dụng', value: (row) => row.available || 0 },
            onHold: { label: 'Đang Giữ', value: (row) => row.reservedSafe || 0 },
            incoming: { label: 'Đang Nhập', value: (row) => row.incoming || 0 },
            unitPrice: { label: 'Giá Đơn Vị ($)', value: (row) => row.price || 0 },
            totalValue: { label: 'Tổng Giá Trị ($)', value: (row) => row.inventoryValue || 0 },
            status: { label: 'Trạng Thái', value: (row) => row.healthStatus },
            warningLevel: { label: 'Cảnh Báo', value: (row) => row.lowThresholdSafe },
            lastUpdated: {
                label: 'Cập Nhật Cuối',
                value: (row) => (row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('vi-VN') : ''),
            },
        };

        const requestedHeaders = columns.map((colId) => ({
            key: colId,
            label: columnDefinitions[colId]?.label || colId,
        }));

        const mappedData = items.map((item) => {
            const row = {};
            columns.forEach((colId) => {
                const def = columnDefinitions[colId];
                if (def) {
                    row[colId] = def.value(item);
                } else {
                    row[colId] = '';
                }
            });
            return row;
        });

        return toCsv(mappedData, requestedHeaders);
    }

    async getInventoryVariantDetail(variantId) {
        if (!mongoose.Types.ObjectId.isValid(variantId)) throw new Error('Invalid variant id');

        const variant = await ProductVariant.findById(variantId).populate('product_id', 'name category brand').lean();
        if (!variant) throw new Error('Variant not found');

        const adjustments = await InventoryAdjustment.find({ variant: variantId }).sort({ createdAt: -1 }).limit(50).lean();
        return { variant, adjustments };
    }
}

export default new InventoryService();
