import { Router } from 'express';
import { chatbotController } from '../controllers/chatbot.controller';

const router = Router();

router.post('/message', chatbotController.processMessage);

export default router; 