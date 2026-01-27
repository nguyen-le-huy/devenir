import express from 'express'
import { authenticate, isAdmin } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
  customerQuerySchema,
} from '../validators/customer.validator.js'
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
router.get('/', validate(customerQuerySchema), getCustomers)
router.get('/:id/orders', validate(customerIdParamSchema), getCustomerOrders)
router.get('/:id', validate(customerIdParamSchema), getCustomerById)
router.post('/', validate(createCustomerSchema), createCustomer)
router.put('/:id', validate(updateCustomerSchema), updateCustomer)
router.delete('/:id', validate(customerIdParamSchema), deleteCustomer)

export default router
