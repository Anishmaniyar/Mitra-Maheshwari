import { Router } from 'express';
import adminRouter from '../modules/admin/admin.route.js';
import authRouter from '../modules/auth/auth.route.js';
import familyRouter from '../modules/family/family.route.js';
import paymentRouter from '../modules/payment/payment.route.js';
import registrationRouter from '../modules/registration/registration.route.js';
import statsRouter from '../modules/stats/stats.route.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/registration', registrationRouter);
router.use('/family', familyRouter);
router.use('/payments', paymentRouter);
router.use('/admin', adminRouter);
router.use('/stats', statsRouter);

export default router;
