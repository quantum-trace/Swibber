import { Router } from 'express';
import { getBalance, getTransactions, initiateAddMoney, confirmAddMoney, withdraw } from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/balance', authenticate, getBalance);
router.get('/transactions', authenticate, getTransactions);
router.post('/add-money', authenticate, initiateAddMoney);
router.post('/add-money/confirm', authenticate, confirmAddMoney);
router.post('/withdraw', authenticate, withdraw);

export default router;
