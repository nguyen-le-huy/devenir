import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import User from '../models/UserModel.js'
import Order from '../models/OrderModel.js'
import logger from '../config/logger.js'

const DAY_IN_MS = 24 * 60 * 60 * 1000
const DEFAULT_PROFILE = {
  loyaltyTier: 'bronze',
  status: 'prospect',
  preferredChannel: 'email',
  marketingOptIn: true,
  tags: [],
  notes: '',
  source: 'organic',
  relationshipScore: 50,
  accountManager: '',
  lastContactedAt: null,
}

const sanitizeSearch = (value = '') => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const convertPeriodToDate = (period) => {
  if (!period) return null
  const now = Date.now()
  switch (period) {
    case '30d':
      return new Date(now - 30 * DAY_IN_MS)
    case '60d':
      return new Date(now - 60 * DAY_IN_MS)
    case '90d':
      return new Date(now - 90 * DAY_IN_MS)
    case 'ytd': {
      const today = new Date()
      return new Date(today.getFullYear(), 0, 1)
    }
    default:
      return null
  }
}

const buildSortStage = (sort) => {
  switch (sort) {
    case 'value_desc':
      return { totalSpent: -1, lastOrderDate: -1 }
    case 'orders_desc':
      return { totalOrders: -1, lastOrderDate: -1 }
    case 'engagement_desc':
      return { engagementScore: -1, lastOrderDate: -1 }
    case 'recent':
    default:
      return { lastOrderDate: -1, createdAt: -1 }
  }
}

const mapFacetToObject = (facet = []) => {
  if (!Array.isArray(facet)) return {}
  return facet.reduce((acc, item) => {
    if (!item) return acc
    acc[item._id || 'unknown'] = item.count
    return acc
  }, {})
}

const percentChange = (current = 0, previous = 0) => {
  if (!previous) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

const getTierFromSpend = (total = 0) => {
  if (total >= 10000) return 'platinum'  // ≥ $10,000
  if (total >= 5000) return 'gold'       // ≥ $5,000
  if (total >= 2500) return 'silver'     // ≥ $2,500
  return 'bronze'                         // < $2,500 (Khách mới)
}

const determineSegment = ({ totalSpent = 0, totalOrders = 0, lastOrderDate, createdAt, lastLogin }) => {
  const now = Date.now()
  const fiveDaysAgo = now - 5 * DAY_IN_MS
  const tenDaysAgo = now - 10 * DAY_IN_MS
  const fifteenDaysAgo = now - 15 * DAY_IN_MS
  const thirtyDaysAgo = now - 30 * DAY_IN_MS
  const createdTime = createdAt ? new Date(createdAt).getTime() : now
  const lastOrderTime = lastOrderDate ? new Date(lastOrderDate).getTime() : null
  const lastLoginTime = lastLogin ? new Date(lastLogin).getTime() : null

  // VIP: Chi >$10,000 VÀ ≥5 đơn
  if (totalSpent >= 10000 && totalOrders >= 5) return 'vip'
  
  // Returning: ≥3 đơn VÀ lần cuối <10 ngày
  if (totalOrders >= 3 && lastOrderTime && lastOrderTime >= tenDaysAgo) return 'returning'
  
  // New: Đăng ký mới <5 ngày (không cần đơn)
  if (createdTime >= fiveDaysAgo) return 'new'
  
  // At-risk: ≥1 đơn NHƯNG lần cuối >30 ngày
  if (totalOrders >= 1 && lastOrderTime && lastOrderTime < thirtyDaysAgo) return 'at-risk'
  
  // Inactive: 0 đơn VÀ không login gần đây (>15 ngày)
  if (totalOrders === 0 && (!lastLoginTime || lastLoginTime < fifteenDaysAgo)) return 'inactive'
  
  // Regular: 0 đơn NHƯNG vẫn login gần đây (<15 ngày)
  return 'regular'
}

const calculateEngagementScore = ({ totalOrders = 0, totalSpent = 0, lastOrderDate, lastLogin }) => {
  const now = Date.now()
  const recentBoundary = now - 30 * DAY_IN_MS
  const hasRecentOrder = lastOrderDate ? new Date(lastOrderDate).getTime() >= recentBoundary : false
  const hasRecentLogin = lastLogin ? new Date(lastLogin).getTime() >= recentBoundary : false

  const baseScore = Math.min(100,
    (totalOrders * 12) +
    (totalSpent / 40) +
    (hasRecentOrder ? 15 : 0) +
    (hasRecentLogin ? 10 : 0)
  )
  return Math.round(baseScore)
}

const buildCustomerAggregationPipeline = ({ searchRegex = null, additionalMatch = {} } = {}) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_IN_MS)
  const ninetyDaysAgo = new Date(Date.now() - 90 * DAY_IN_MS)

  // CHANGED: Remove role filter to include all users (including admin if needed)
  // Only exclude archived users
  const baseMatch = { isArchived: { $ne: true }, ...additionalMatch }
  if (searchRegex) {
    baseMatch.$or = [
      { email: searchRegex },
      { username: searchRegex },
      { firstName: searchRegex },
      { lastName: searchRegex },
      { phone: searchRegex },
    ]
  }

  return [
    { $match: baseMatch },
    {
      $addFields: {
        customerProfile: { $ifNull: ['$customerProfile', DEFAULT_PROFILE] },
      },
    },
    {
      $addFields: {
        primaryAddress: {
          $ifNull: [
            {
              $first: {
                $filter: {
                  input: '$addresses',
                  as: 'address',
                  cond: { $eq: ['$$address.isDefault', true] },
                },
              },
            },
            { $first: '$addresses' },
          ],
        },
      },
    },
    {
      $lookup: {
        from: 'orders',
        let: { customerId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$user', '$$customerId'] } } },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$totalPrice' },
              totalOrders: { $sum: 1 },
              lastOrderDate: { $max: '$createdAt' },
              lastOrderValue: { $first: '$totalPrice' },
              lastOrderStatus: { $first: '$status' },
              avgOrderValue: { $avg: '$totalPrice' },
            },
          },
          { $project: { _id: 0 } },
        ],
        as: 'orderStats',
      },
    },
    {
      $addFields: {
        orderStats: {
          $ifNull: [
            { $arrayElemAt: ['$orderStats', 0] },
            {
              totalSpent: 0,
              totalOrders: 0,
              lastOrderDate: null,
              lastOrderValue: 0,
              lastOrderStatus: null,
              avgOrderValue: 0,
            },
          ],
        },
      },
    },
    {
      $addFields: {
        totalSpent: '$orderStats.totalSpent',
        totalOrders: '$orderStats.totalOrders',
        lastOrderDate: '$orderStats.lastOrderDate',
        lastOrderValue: '$orderStats.lastOrderValue',
        lastOrderStatus: '$orderStats.lastOrderStatus',
        averageOrderValue: { $ifNull: ['$orderStats.avgOrderValue', 0] },
        calculatedTier: {
          $switch: {
            branches: [
              { case: { $gte: ['$orderStats.totalSpent', 10000] }, then: 'platinum' },  // ≥ $10,000
              { case: { $gte: ['$orderStats.totalSpent', 5000] }, then: 'gold' },       // ≥ $5,000
              { case: { $gte: ['$orderStats.totalSpent', 2500] }, then: 'silver' },     // ≥ $2,500
            ],
            default: 'bronze',  // < $2,500 (Khách mới)
          },
        },
      },
    },
    {
      $addFields: {
        // ALWAYS use calculated tier based on actual totalSpent (ignore old manual tier)
        loyaltyTier: '$calculatedTier',
        customerSegment: {
          $switch: {
            branches: [
              {
                // VIP: Chi >$10,000 VÀ ≥5 đơn
                case: {
                  $and: [
                    { $gte: ['$orderStats.totalSpent', 10000] },
                    { $gte: ['$orderStats.totalOrders', 5] },
                  ],
                },
                then: 'vip',
              },
              {
                // Returning: ≥3 đơn VÀ lần cuối <10 ngày
                case: {
                  $and: [
                    { $gte: ['$orderStats.totalOrders', 3] },
                    { $gte: ['$orderStats.lastOrderDate', new Date(Date.now() - 10 * DAY_IN_MS)] },
                  ],
                },
                then: 'returning',
              },
              {
                // New: Đăng ký mới <5 ngày (không cần đơn)
                case: {
                  $gte: ['$createdAt', new Date(Date.now() - 5 * DAY_IN_MS)],
                },
                then: 'new',
              },
              {
                // At-risk: ≥1 đơn NHƯNG lần cuối >30 ngày
                case: {
                  $and: [
                    { $gte: ['$orderStats.totalOrders', 1] },
                    { $lt: ['$orderStats.lastOrderDate', new Date(Date.now() - 30 * DAY_IN_MS)] },
                  ],
                },
                then: 'at-risk',
              },
              {
                // Inactive: 0 đơn VÀ không login gần đây (>15 ngày hoặc null)
                case: {
                  $and: [
                    { $eq: ['$orderStats.totalOrders', 0] },
                    {
                      $or: [
                        { $eq: ['$lastLogin', null] },
                        { $lt: ['$lastLogin', new Date(Date.now() - 15 * DAY_IN_MS)] },
                      ],
                    },
                  ],
                },
                then: 'inactive',
              },
            ],
            // Regular: Còn lại (0 đơn NHƯNG vẫn login gần đây)
            default: 'regular',
          },
        },
        engagementScore: {
          $round: [
            {
              $min: [
                100,
                {
                  $add: [
                    { $multiply: [{ $ifNull: ['$orderStats.totalOrders', 0] }, 12] },
                    { $divide: [{ $ifNull: ['$orderStats.totalSpent', 0] }, 40] },
                    { $cond: [{ $gte: ['$orderStats.lastOrderDate', thirtyDaysAgo] }, 15, 0] },
                    { $cond: [{ $gte: ['$lastLogin', thirtyDaysAgo] }, 10, 0] },
                  ],
                },
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        password: 0,
        resetPasswordToken: 0,
        resetPasswordExpires: 0,
        emailVerificationToken: 0,
        emailVerificationExpires: 0,
        orderStats: 0,
        calculatedTier: 0,
      },
    },
  ]
}

const enrichSingleCustomer = async (customerId) => {
  const [customer] = await User.aggregate([
    ...buildCustomerAggregationPipeline({ additionalMatch: { _id: new mongoose.Types.ObjectId(customerId) } }),
    { $limit: 1 },
  ])
  return customer
}

const generateUniqueUsername = async (email) => {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'customer'
  let candidate = base
  let counter = 1
  while (await User.exists({ username: candidate })) {
    candidate = `${base}${counter}`
    counter += 1
  }
  return candidate
}

const buildCustomerInsights = ({ data, stats }) => {
  const insights = []
  if (stats.totals.totalOrders === 0) {
    insights.push('Chưa có đơn hàng nào — hãy khuyến khích khách thử đơn đầu tiên.')
  } else {
    insights.push(`Giá trị đơn trung bình ${Math.round(stats.totals.avgOrderValue || 0).toLocaleString('vi-VN')} ₫.`)
    insights.push(`Đã chi tổng cộng ${Math.round(stats.totals.totalSpent || 0).toLocaleString('vi-VN')} ₫ với ${stats.totals.totalOrders} đơn.`)
  }
  const topChannel = stats.paymentMethods?.[0]
  if (topChannel) {
    insights.push(`Ưa chuộng thanh toán qua ${topChannel.label || topChannel._id} (${topChannel.count} lần).`)
  }
  insights.push(`Điểm gắn kết hiện tại ${data.engagementScore}/100 — ${data.customerSegment === 'at-risk' ? 'cần chăm sóc lại.' : 'ổn định.'}`)
  return insights
}

export const getCustomers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    segment,
    tier,
    status,
    channel,
    tags,
    period,
    sort = 'recent',
  } = req.query

  const numericPage = Math.max(parseInt(page, 10) || 1, 1)
  const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100)
  const skip = (numericPage - 1) * numericLimit

  const tagList = typeof tags === 'string' && tags.length
    ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)
    : []

  const searchRegex = search ? new RegExp(sanitizeSearch(search.trim()), 'i') : null
  const pipeline = buildCustomerAggregationPipeline({ searchRegex })

  const filterConditions = [{ isArchived: { $ne: true } }]
  if (segment && segment !== 'all') filterConditions.push({ customerSegment: segment })
  if (tier && tier !== 'all') filterConditions.push({ loyaltyTier: tier })
  if (status && status !== 'all') filterConditions.push({ 'customerProfile.status': status })
  if (channel && channel !== 'all') filterConditions.push({ 'customerProfile.preferredChannel': channel })
  if (tagList.length) filterConditions.push({ 'customerProfile.tags': { $all: tagList } })

  const periodDate = convertPeriodToDate(period)
  if (periodDate) {
    filterConditions.push({
      $or: [
        { lastOrderDate: { $gte: periodDate } },
        { createdAt: { $gte: periodDate } },
        { updatedAt: { $gte: periodDate } },
      ],
    })
  }

  if (filterConditions.length) {
    pipeline.push({ $match: { $and: filterConditions } })
  }

  pipeline.push({
    $facet: {
      data: [
        { $sort: buildSortStage(sort) },
        { $skip: skip },
        { $limit: numericLimit },
      ],
      totalCount: [{ $count: 'count' }],
      segmentCounts: [
        { $group: { _id: '$customerSegment', count: { $sum: 1 } } },
      ],
      statusCounts: [
        { $group: { _id: '$customerProfile.status', count: { $sum: 1 } } },
      ],
      loyaltyCounts: [
        { $group: { _id: '$loyaltyTier', count: { $sum: 1 } } },
      ],
      channelCounts: [
        { $group: { _id: '$customerProfile.preferredChannel', count: { $sum: 1 } } },
      ],
      tagCounts: [
        { $unwind: { path: '$customerProfile.tags', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$customerProfile.tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 30 },
      ],
      totals: [
        { $group: { _id: null, totalSpent: { $sum: '$totalSpent' }, avgOrderValue: { $avg: '$averageOrderValue' } } },
      ],
    },
  })

  const [result] = await User.aggregate(pipeline)
  const total = result?.totalCount?.[0]?.count || 0

  res.status(200).json({
    success: true,
    data: result?.data || [],
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      pages: Math.max(Math.ceil(total / numericLimit), 1),
    },
    meta: {
      segments: mapFacetToObject(result?.segmentCounts),
      statuses: mapFacetToObject(result?.statusCounts),
      loyalty: mapFacetToObject(result?.loyaltyCounts),
      channels: mapFacetToObject(result?.channelCounts),
      tags: (result?.tagCounts || []).map(tag => ({ label: tag._id, count: tag.count })),
      totals: {
        totalSpent: result?.totals?.[0]?.totalSpent || 0,
        avgOrderValue: result?.totals?.[0]?.avgOrderValue || 0,
      },
    },
  })
})

export const getCustomerOverview = asyncHandler(async (_req, res) => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const last30Days = new Date(now.getTime() - 30 * DAY_IN_MS)
  const prev30DaysStart = new Date(now.getTime() - 60 * DAY_IN_MS)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    totalCustomers,
    newThisMonth,
    newLastMonth,
    activeCustomersIds,
    previousActiveIds,
    orderSummary,
    customerSpend,
    distribution,
    segmentDistribution,
    trendAggregation,
  ] = await Promise.all([
    User.countDocuments({ role: 'user', isArchived: { $ne: true } }),
    User.countDocuments({ role: 'user', isArchived: { $ne: true }, createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ role: 'user', isArchived: { $ne: true }, createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth } }),
    Order.distinct('user', { createdAt: { $gte: last30Days } }),
    Order.distinct('user', { createdAt: { $gte: prev30DaysStart, $lt: last30Days } }),
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer',
          pipeline: [{ $project: { createdAt: 1 } }],
        },
      },
      {
        $addFields: {
          createdAt: { $arrayElemAt: ['$customer.createdAt', 0] },
        },
      },
      { $project: { customer: 0 } },
    ]),
    User.aggregate([
      { $match: { role: 'user', isArchived: { $ne: true } } },
      {
        $facet: {
          loyalty: [
            { $group: { _id: '$customerProfile.loyaltyTier', count: { $sum: 1 } } },
          ],
          channels: [
            { $group: { _id: '$customerProfile.preferredChannel', count: { $sum: 1 } } },
          ],
        },
      },
    ]),
    User.aggregate([
      ...buildCustomerAggregationPipeline(),
      { $group: { _id: '$customerSegment', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ])

  const orderStats = orderSummary?.[0] || { totalRevenue: 0, orderCount: 0, avgOrderValue: 0 }
  const activeCustomers = activeCustomersIds.length
  const previousActive = previousActiveIds.length
  const segmentMap = mapFacetToObject(segmentDistribution)

  const vipCustomers = segmentMap['vip'] || 0
  const returningCustomers = (segmentMap['returning'] || 0) + vipCustomers
  const atRiskCustomers = segmentMap['at-risk'] || 0

  const repeatPurchaseRate = totalCustomers
    ? ((returningCustomers / totalCustomers) * 100)
    : 0
  const churnRisk = totalCustomers
    ? ((atRiskCustomers / totalCustomers) * 100)
    : 0

  const totalLifetimeSpent = customerSpend.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
  const lifetimeValue = totalCustomers ? totalLifetimeSpent / totalCustomers : 0

  const trendMap = new Map()
  trendAggregation.forEach((item) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
    trendMap.set(key, item)
  })

  const trend = []
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const data = trendMap.get(key)
    trend.push({
      label: date.toLocaleString('en-US', { month: 'short' }),
      revenue: data?.revenue || 0,
      orders: data?.orders || 0,
    })
  }

  const overviewDistribution = distribution?.[0] || { loyalty: [], channels: [] }
  const channelList = [...(overviewDistribution.channels || [])].sort((a, b) => (b?.count || 0) - (a?.count || 0))
  const topChannel = channelList[0]

  const insights = []
  if (repeatPurchaseRate) {
    insights.push(`Tỷ lệ mua lại đạt ${repeatPurchaseRate.toFixed(1)}%.`)
  }
  if (churnRisk) {
    insights.push(`${atRiskCustomers} khách hàng có nguy cơ rời bỏ (${churnRisk.toFixed(1)}%).`)
  }
  if (topChannel) {
    const channelShare = totalCustomers ? ((topChannel.count / totalCustomers) * 100).toFixed(1) : '0'
    insights.push(`Kênh ưu tiên: ${topChannel._id || 'email'} (${channelShare}%).`)
  }
  insights.push(`Giá trị vòng đời trung bình ${Math.round(lifetimeValue).toLocaleString('vi-VN')} ₫.`)

  res.status(200).json({
    success: true,
    data: {
      totals: {
        totalCustomers,
        newThisMonth,
        vipCustomers,
        activeCustomers,
        growth: {
          totalCustomers: Number(percentChange(newThisMonth, newLastMonth).toFixed(1)),
          newThisMonth: Number(percentChange(newThisMonth, newLastMonth).toFixed(1)),
          vipCustomers: null,
          activeCustomers: Number(percentChange(activeCustomers, previousActive).toFixed(1)),
        },
      },
      revenue: {
        avgOrderValue: orderStats.avgOrderValue || 0,
        lifetimeValue,
        repeatPurchaseRate,
      },
      retention: {
        returningCustomers,
        atRiskCustomers,
        churnRisk,
      },
      distribution: {
        segments: Object.entries(segmentMap).map(([label, count]) => ({ label, count })),
        loyalty: (overviewDistribution.loyalty || []).map(item => ({ label: item._id || 'unknown', count: item.count })),
        channels: channelList.map(item => ({ label: item._id || 'unknown', count: item.count })),
      },
      trend,
      insights,
    },
  })
})

export const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const customer = await User.findOne({ _id: id, isArchived: { $ne: true } }).lean()

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    })
  }

  const statsAggregation = await Order.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(id) } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: '$totalPrice' },
              avgOrderValue: { $avg: '$totalPrice' },
              lastOrderDate: { $max: '$createdAt' },
            },
          },
        ],
        paymentMethods: [
          { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        statusBreakdown: [
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ],
        topProducts: [
          { $unwind: '$orderItems' },
          {
            $group: {
              _id: '$orderItems.name',
              revenue: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.price'] } },
              quantity: { $sum: '$orderItems.quantity' },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 5 },
        ],
      },
    },
    {
      $project: {
        totals: { $ifNull: [{ $arrayElemAt: ['$totals', 0] }, { totalOrders: 0, totalSpent: 0, avgOrderValue: 0, lastOrderDate: null }] },
        paymentMethods: {
          $map: {
            input: '$paymentMethods',
            as: 'pm',
            in: { label: '$$pm._id', count: '$$pm.count' },
          },
        },
        statusBreakdown: {
          $map: {
            input: '$statusBreakdown',
            as: 'status',
            in: { label: '$$status._id', count: '$$status.count' },
          },
        },
        topProducts: {
          $map: {
            input: '$topProducts',
            as: 'product',
            in: { name: '$$product._id', revenue: '$$product.revenue', quantity: '$$product.quantity' },
          },
        },
      },
    },
  ])

  const stats = statsAggregation?.[0] || {
    totals: { totalOrders: 0, totalSpent: 0, avgOrderValue: 0, lastOrderDate: null },
    paymentMethods: [],
    statusBreakdown: [],
    topProducts: [],
  }

  const enrichedCustomer = {
    ...customer,
    totalOrders: stats.totals.totalOrders || 0,
    totalSpent: stats.totals.totalSpent || 0,
    averageOrderValue: stats.totals.avgOrderValue || 0,
    lastOrderDate: stats.totals.lastOrderDate,
    loyaltyTier: customer.customerProfile?.loyaltyTier || getTierFromSpend(stats.totals.totalSpent),
    customerSegment: determineSegment({
      totalSpent: stats.totals.totalSpent,
      totalOrders: stats.totals.totalOrders,
      lastOrderDate: stats.totals.lastOrderDate,
      createdAt: customer.createdAt,
    }),
    engagementScore: calculateEngagementScore({
      totalOrders: stats.totals.totalOrders,
      totalSpent: stats.totals.totalSpent,
      lastOrderDate: stats.totals.lastOrderDate,
      lastLogin: customer.lastLogin,
    }),
    primaryAddress: customer.addresses?.find(addr => addr.isDefault) || customer.addresses?.[0] || null,
  }

  const recentOrders = await Order.find({ user: id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('totalPrice status paymentMethod createdAt orderItems shippingAddress')
    .lean()

  res.status(200).json({
    success: true,
    data: {
      ...enrichedCustomer,
      stats,
      recentOrders,
      insights: buildCustomerInsights({ data: enrichedCustomer, stats, recentOrders }),
    },
  })
})

export const getCustomerOrders = asyncHandler(async (req, res) => {
  const { id } = req.params
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50)

  const orders = await Order.find({ user: id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('totalPrice status paymentMethod createdAt orderItems shippingAddress')
    .lean()

  res.status(200).json({
    success: true,
    data: orders,
  })
})

export const createCustomer = asyncHandler(async (req, res) => {
  const {
    email,
    firstName,
    lastName,
    phone,
    password,
    customerProfile,
    preferences,
    addresses,
  } = req.body

  const existing = await User.findOne({ email })
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Email already exists',
    })
  }

  const username = await generateUniqueUsername(email)
  const fallbackPassword = password || `${Math.random().toString(36).slice(-8)}Ab!`

  const customer = await User.create({
    username,
    email,
    password: fallbackPassword,
    firstName,
    lastName,
    phone,
    role: 'user',
    customerProfile,
    preferences,
    addresses,
  })

  const enriched = await enrichSingleCustomer(customer._id)
  logger.info('Customer created', { customerId: customer._id })

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: enriched,
  })
})

export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updates = req.body

  const customer = await User.findOne({ _id: id, isArchived: { $ne: true } })
  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    })
  }

  if (updates.email && updates.email !== customer.email) {
    const emailExists = await User.findOne({ email: updates.email, _id: { $ne: id } })
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      })
    }
    customer.email = updates.email
  }

  const mergeableFields = ['firstName', 'lastName', 'phone', 'birthday', 'isEmailVerified']
  mergeableFields.forEach((field) => {
    if (updates[field] !== undefined) {
      customer[field] = updates[field]
    }
  })

  if (updates.preferences) {
    const currentPreferences = customer.preferences && typeof customer.preferences.toObject === 'function'
      ? customer.preferences.toObject()
      : (customer.preferences || {})
    const incomingPreferences = { ...updates.preferences }
    customer.preferences = {
      ...currentPreferences,
      ...incomingPreferences,
      channels: {
        ...(currentPreferences.channels || {}),
        ...(incomingPreferences.channels || {}),
      },
    }
  }

  if (updates.customerProfile) {
    const currentProfile = customer.customerProfile && typeof customer.customerProfile.toObject === 'function'
      ? customer.customerProfile.toObject()
      : (customer.customerProfile || {})
    const incomingProfile = { ...updates.customerProfile }
    customer.customerProfile = {
      ...currentProfile,
      ...incomingProfile,
      tags: incomingProfile.tags ?? currentProfile.tags,
    }
  }

  if (Array.isArray(updates.addresses)) {
    customer.addresses = updates.addresses
  }

  if (updates.password) {
    customer.password = updates.password
  }

  await customer.save()
  const enriched = await enrichSingleCustomer(customer._id)
  logger.info('Customer updated', { customerId: customer._id })

  res.status(200).json({
    success: true,
    message: 'Customer updated successfully',
    data: enriched,
  })
})

export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params
  const customer = await User.findOne({ _id: id, role: 'user' })
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' })
  }

  if (customer.isArchived) {
    return res.status(400).json({ success: false, message: 'Customer already archived' })
  }

  customer.isArchived = true
  customer.archivedAt = new Date()
  await customer.save()
  logger.info('Customer archived', { customerId: customer._id })

  res.status(200).json({ success: true, message: 'Customer archived successfully' })
})
