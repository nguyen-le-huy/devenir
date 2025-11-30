import asyncHandler from 'express-async-handler'
import Brand from '../models/BrandModel.js'
import Product from '../models/ProductModel.js'
import logger from '../config/logger.js'
import { emitRealtimeEvent } from '../utils/realtimeEmitter.js'

const buildLookupPipeline = () => ([
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
])

const sortMap = {
  'name-asc': { name: 1 },
  'name-desc': { name: -1 },
  'recent': { createdAt: -1 },
  'updated': { updatedAt: -1 },
  'products-desc': { totalProducts: -1 },
  'products-asc': { totalProducts: 1 },
}

export const getBrands = asyncHandler(async (req, res) => {
  const {
    search = '',
    status = 'all',
    sort = 'name-asc',
    page = 1,
    limit = 20,
  } = req.query

  const pageNum = Math.max(parseInt(page, 10) || 1, 1)
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100)
  const skip = (pageNum - 1) * limitNum

  const filter = {}
  if (search) {
    filter.name = { $regex: search.trim(), $options: 'i' }
  }
  if (status === 'active') {
    filter.isActive = true
  } else if (status === 'inactive') {
    filter.isActive = false
  }

  const sortStage = sortMap[sort] || sortMap['name-asc']
  const lookupPipeline = buildLookupPipeline()

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
  ])

  const meta = metaStats[0] || {
    totalBrands: 0,
    activeBrands: 0,
    inactiveBrands: 0,
    totalProducts: 0,
    activeProducts: 0,
  }

  res.status(200).json({
    success: true,
    data: brands,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalFiltered,
      pages: Math.ceil(totalFiltered / limitNum) || 1,
    },
    meta,
    topBrands,
  })
})

export const getBrandById = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id).lean()

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found',
    })
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
  ])

  res.status(200).json({
    success: true,
    data: {
      ...brand,
      metrics,
      recentProducts,
    },
  })
})

export const createBrand = asyncHandler(async (req, res) => {
  const payload = {
    name: req.body.name?.trim(),
    description: req.body.description,
    logoUrl: req.body.logoUrl,
    tagline: req.body.tagline,
    originCountry: req.body.originCountry,
    foundedYear: req.body.foundedYear,
    website: req.body.website,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true,
  }

  const existing = await Brand.findOne({ name: payload.name })
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Brand name already exists',
    })
  }

  const brand = await Brand.create(payload)
  emitRealtimeEvent(req, 'brand:created', { id: brand._id })

  res.status(201).json({
    success: true,
    data: brand,
  })
})

export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id)
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found',
    })
  }

  const fields = ['name', 'description', 'logoUrl', 'tagline', 'originCountry', 'foundedYear', 'website', 'isActive']
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      brand[field] = field === 'name' ? req.body[field].trim() : req.body[field]
    }
  })

  await brand.save()
  emitRealtimeEvent(req, 'brand:updated', { id: brand._id })

  res.status(200).json({
    success: true,
    data: brand,
  })
})

export const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id)
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found',
    })
  }

  const productCount = await Product.countDocuments({ brand: brand._id })
  if (productCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Reassign or remove products before deleting this brand',
    })
  }

  await brand.deleteOne()
  emitRealtimeEvent(req, 'brand:deleted', { id: brand._id })

  res.status(200).json({
    success: true,
    message: 'Brand deleted successfully',
  })
})
