import express from 'express';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { shipmentIdParamSchema, startShipmentSchema, shipmentListSchema } from '../validators/shipment.validator.js';
import {
  startShipment,
  markDelivered,
  simulateDelivery,
  getShipmentsList,
  cancelShipment,
} from '../controllers/ShipmentController.js';

const router = express.Router();

router.use(authenticate, isAdmin);

router.get('/', validate(shipmentListSchema), getShipmentsList);
router.post('/:id/start', validate(startShipmentSchema), startShipment);
router.post('/:id/deliver', validate(shipmentIdParamSchema), markDelivered);
router.post('/:id/simulate', validate(shipmentIdParamSchema), simulateDelivery);
router.post('/:id/cancel', validate(shipmentIdParamSchema), cancelShipment);

export default router;
