import { Router } from 'express';
import { FriendController } from '../controllers/friend.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { sendFriendRequestValidator } from '../utils/validators';

const router = Router();
const friendController = new FriendController();

// All routes are protected
router.use(authenticate);

router.post('/request', sendFriendRequestValidator, validate, friendController.sendFriendRequest.bind(friendController));
router.post('/request/:requestId/accept', friendController.acceptFriendRequest.bind(friendController));
router.post('/request/:requestId/reject', friendController.rejectFriendRequest.bind(friendController));
router.get('/requests', friendController.getPendingRequests.bind(friendController));
router.get('/', friendController.getFriends.bind(friendController));
router.delete('/:friendId', friendController.removeFriend.bind(friendController));
router.get('/search', friendController.searchUsers.bind(friendController));

export default router;