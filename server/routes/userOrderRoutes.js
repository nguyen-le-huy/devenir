import express from 'express'
import { authenticate } from '../middleware/authMiddleware.js'
import { getMyOrderById, getMyOrders } from '../controllers/OrderController.js'

const router = express.Router()

router.use(authenticate)

router.get('/my', getMyOrders)
router.get('/my/:id', getMyOrderById)

export default router
