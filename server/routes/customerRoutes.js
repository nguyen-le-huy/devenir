import express from 'express'
import { authenticate, isAdmin } from '../middleware/authMiddleware.js'
import { sanitizeBody, validateCustomerInput, validateObjectId, validatePagination } from '../middleware/validationMiddleware.js'
import {
  getCustomers,
  getCustomerOverview,
  getCustomerById,
  getCustomerOrders,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/CustomerController.js'

const router = express.Router()

router.use(authenticate, isAdmin)

router.get('/overview', getCustomerOverview)
router.get('/', validatePagination, getCustomers)
router.get('/:id/orders', validateObjectId('id'), getCustomerOrders)
router.get('/:id', validateObjectId('id'), getCustomerById)
router.post('/', sanitizeBody, validateCustomerInput, createCustomer)
router.put('/:id', sanitizeBody, validateObjectId('id'), validateCustomerInput, updateCustomer)
router.delete('/:id', validateObjectId('id'), deleteCustomer)

export default router
