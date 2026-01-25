import { Router } from 'express';
import { billingController } from '../controllers/billingController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/enums';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Bill generation and management routes
router.post('/generate', 
  authorize(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN),
  billingController.generateBill.bind(billingController)
);

// Utility routes (must come before parameterized routes)
router.post('/calculate', 
  authorize(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN),
  billingController.calculateBillTotals.bind(billingController)
);

// Management and reporting routes (must come before parameterized routes)
router.get('/pending', 
  authorize(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN),
  billingController.getPendingBills.bind(billingController)
);

router.get('/today', 
  authorize(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN),
  billingController.getTodaysPaidBills.bind(billingController)
);

router.get('/revenue/summary', 
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  billingController.getRevenueSummary.bind(billingController)
);

// Configuration routes (must come before parameterized routes)
router.get('/config', 
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  billingController.getBillingConfig.bind(billingController)
);

router.put('/config', 
  authorize(UserRole.ADMIN),
  billingController.updateBillingConfig.bind(billingController)
);

// Restaurant info routes (must come before parameterized routes)
router.get('/restaurant-info', 
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  billingController.getRestaurantInfo.bind(billingController)
);

router.put('/restaurant-info', 
  authorize(UserRole.ADMIN),
  billingController.updateRestaurantInfo.bind(billingController)
);

// PDF options routes (must come before parameterized routes)
router.get('/pdf-options', 
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  billingController.getPDFOptions.bind(billingController)
);

router.put('/pdf-options', 
  authorize(UserRole.ADMIN),
  billingController.updatePDFOptions.bind(billingController)
);

router.get('/order/:orderId/pdf', 
  authorize(UserRole.CASHIER, UserRole.WAITER, UserRole.MANAGER, UserRole.ADMIN),
  billingController.generatePDFInvoiceByOrderId.bind(billingController)
);

router.get('/order/:orderId', 
  authorize(UserRole.CASHIER, UserRole.WAITER, UserRole.MANAGER, UserRole.ADMIN),
  billingController.getBillByOrderId.bind(billingController)
);

router.get('/exists/:orderId', 
  authorize(UserRole.CASHIER, UserRole.WAITER, UserRole.MANAGER, UserRole.ADMIN),
  billingController.checkBillExists.bind(billingController)
);

router.get('/:id', 
  authorize(UserRole.CASHIER, UserRole.WAITER, UserRole.MANAGER, UserRole.ADMIN),
  billingController.getBillById.bind(billingController)
);

router.get('/', 
  authorize(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN),
  billingController.searchBills.bind(billingController)
);

router.put('/:id', 
  authorize(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN),
  billingController.updateBill.bind(billingController)
);

// Payment processing routes
router.post('/:id/payment', 
  authorize(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN),
  billingController.processPayment.bind(billingController)
);

router.post('/:id/cancel', 
  authorize(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN),
  billingController.cancelBill.bind(billingController)
);

router.post('/:id/reopen', 
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  billingController.reopenBill.bind(billingController)
);

// PDF generation routes
router.get('/:id/pdf', 
  authorize(UserRole.CASHIER, UserRole.WAITER, UserRole.MANAGER, UserRole.ADMIN),
  billingController.generatePDFInvoice.bind(billingController)
);

export default router;