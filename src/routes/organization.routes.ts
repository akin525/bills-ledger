import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createOrganizationValidator, addOrganizationMemberValidator } from '../utils/validators';

const router = Router();
const organizationController = new OrganizationController();

// All routes are protected
router.use(authenticate);

router.post('/', createOrganizationValidator, validate, organizationController.createOrganization.bind(organizationController));
router.get('/', organizationController.getUserOrganizations.bind(organizationController));
router.get('/:organizationId', organizationController.getOrganizationById.bind(organizationController));
router.put('/:organizationId', organizationController.updateOrganization.bind(organizationController));
router.post('/:organizationId/members', addOrganizationMemberValidator, validate, organizationController.addMember.bind(organizationController));
router.delete('/:organizationId/members/:memberId', organizationController.removeMember.bind(organizationController));
router.put('/:organizationId/members/:memberId/role', organizationController.updateMemberRole.bind(organizationController));
router.delete('/:organizationId/leave', organizationController.leaveOrganization.bind(organizationController));
router.delete('/:organizationId', organizationController.deleteOrganization.bind(organizationController));

export default router;