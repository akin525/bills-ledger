import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { sendMessageValidator } from '../utils/validators';

const router = Router();
const conversationController = new ConversationController();

// All routes are protected
router.use(authenticate);

router.post('/direct', conversationController.createOrGetDirectConversation.bind(conversationController));
router.post('/group', conversationController.createGroupConversation.bind(conversationController));
router.get('/', conversationController.getUserConversations.bind(conversationController));
router.get('/:conversationId', conversationController.getConversationById.bind(conversationController));
router.get('/:conversationId/messages', conversationController.getConversationMessages.bind(conversationController));
router.post('/messages', sendMessageValidator, validate, conversationController.sendMessage.bind(conversationController));
router.post('/:conversationId/participants', conversationController.addParticipant.bind(conversationController));
router.delete('/:conversationId/leave', conversationController.leaveConversation.bind(conversationController));

export default router;