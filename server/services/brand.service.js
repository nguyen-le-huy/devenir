import Brand from '../models/BrandModel.js';
import Product from '../models/ProductModel.js'; // Assuming Product is in the same folder structure
import { emitRealtimeEvent } from '../utils/realtimeEmitter.js';

class BrandService {
    /**
     * Helper: Build Lookup Pipeline
     */
    _buildLookupPipeline() {
        return [
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: 'brand',
                    as: 'products',
                },
            },
            {
                $addFields: {
                    totalProducts: { $size: { $ifNull: ['$products', []] } },
                    activeProducts: {
                        $size: {
                            $filter: {
                                input: { $ifNull: ['$products', []] },
                                as: 'product',
                                cond: { $eq: ['$$product.isActive', true] },
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    products: 0,
                },
            },
        ];
    }

    /**
     * Get Brands with Filtering, Sorting, and Pagination
     */
    async getBrands(query) {
        const {
            search = '',
            status = 'all',
            sort = 'name-asc',
            page = 1,
            limit = 20,
        } = query;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        // Filter
        const filter = {};
        if (search) {
            filter.name = { $regex: search.trim(), $options: 'i' };
        }
        if (status === 'active') {
            filter.isActive = true;
        } else if (status === 'inactive') {
            filter.isActive = false;
        }

        // Sort
        const sortMap = {
            'name-asc': { name: 1 },
            'name-desc': { name: -1 },
            'recent': { createdAt: -1 },
            'updated': { updatedAt: -1 },
            'products-desc': { totalProducts: -1 },
            'products-asc': { totalProducts: 1 },
        };
        const sortStage = sortMap[sort] || sortMap['name-asc'];

        const lookupPipeline = this._buildLookupPipeline();

        const [brands, totalFiltered, metaStats, topBrands] = await Promise.all([
            Brand.aggregate([
                ...lookupPipeline,
                { $match: filter },
                { $sort: sortStage },
                { $skip: skip },
                { $limit: limitNum },
            ]),
            Brand.countDocuments(filter),
            Brand.aggregate([
                ...lookupPipeline,
                {
                    $group: {
                        _id: null,
                        totalBrands: { $sum: 1 },
                        activeBrands: { $sum: { $cond: ['$isActive', 1, 0] } },
                        inactiveBrands: { $sum: { $cond: ['$isActive', 0, 1] } },
                        totalProducts: { $sum: '$totalProducts' },
                        activeProducts: { $sum: '$activeProducts' },
                    },
                },
            ]),
            Brand.aggregate([
                ...lookupPipeline,
                { $sort: { totalProducts: -1, name: 1 } },
                { $limit: 5 },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        logoUrl: 1,
                        totalProducts: 1,
                        originCountry: 1,
                    },
                },
            ]),
        ]);

        const meta = metaStats[0] || {
            totalBrands: 0,
            activeBrands: 0,
            inactiveBrands: 0,
            totalProducts: 0,
            activeProducts: 0,
        };

        return {
            brands,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalFiltered,
                pages: Math.ceil(totalFiltered / limitNum) || 1,
            },
            meta,
            topBrands,
        };
    }

    /**
     * Get Brand By ID with Metrics
     */
    async getBrandById(id) {
        const brand = await Brand.findById(id).lean();

        if (!brand) {
            throw new Error('Brand not found');
        }

        const [metrics = { totalProducts: 0, activeProducts: 0 }, recentProducts] = await Promise.all([
            Product.aggregate([
                { $match: { brand: brand._id } },
                {
                    $group: {
                        _id: '$brand',
                        totalProducts: { $sum: 1 },
                        activeProducts: {
                            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
                        },
                    },
                },
            ]).then((result) => result[0] || { totalProducts: 0, activeProducts: 0 }),
            Product.find({ brand: brand._id })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name status isActive createdAt category')
                .lean(),
        ]);

        return {
            ...brand,
            metrics,
            recentProducts,
        };
    }

    /**
     * Create Brand
     */
    async createBrand(data) {
        const name = data.name?.trim();
        if (await Brand.findOne({ name })) {
            throw new Error('Brand name already exists');
        }

        const brand = await Brand.create({
            ...data,
            name, // Trimmed name
        });

        emitRealtimeEvent('brand:created', { id: brand._id });

        return brand;
    }

    /**
     * Update Brand
     */
    async updateBrand(id, data) {
        const brand = await Brand.findById(id);
        if (!brand) {
            throw new Error('Brand not found');
        }

        const fields = ['name', 'description', 'logoUrl', 'tagline', 'originCountry', 'foundedYear', 'website', 'isActive'];
        fields.forEach((field) => {
            if (data[field] !== undefined) {
                brand[field] = field === 'name' ? data[field].trim() : data[field];
            }
        });

        await brand.save();

        emitRealtimeEvent('brand:updated', { id: brand._id });

        return brand;
    }

    /**
     * Delete Brand
     */
    async deleteBrand(id) {
        const brand = await Brand.findById(id);
        if (!brand) {
            throw new Error('Brand not found');
        }

        const productCount = await Product.countDocuments({ brand: brand._id });
        if (productCount > 0) {
            throw new Error('Reassign or remove products before deleting this brand');
        }

        await brand.deleteOne();

        emitRealtimeEvent('brand:deleted', { id: brand._id });

        return { message: 'Brand deleted successfully' };
    }
}

export default new BrandService();
