import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';

export class OrganizationController {
  // Create organization
  async createOrganization(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const creatorId = req.user?.id;
      const { name, description, avatar } = req.body;

      if (!creatorId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const organization = await prisma.organization.create({
        data: {
          name,
          description,
          avatar,
          creatorId,
          members: {
            create: {
              userId: creatorId,
              role: 'ADMIN',
            },
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      return sendSuccess(res, 'Organization created successfully', organization, 201);
    } catch (error: any) {
      console.error('Create organization error:', error);
      return sendError(res, 'Failed to create organization', error.message, 500);
    }
  }

  // Get organization by ID
  async getOrganizationById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      if (!organization) {
        return sendError(res, 'Organization not found', 'Organization does not exist', 404);
      }

      // Check if user is member
      const isMember = organization.members.some(m => m.userId === userId);
      if (!isMember) {
        return sendError(res, 'Unauthorized', 'You are not a member of this organization', 403);
      }

      return sendSuccess(res, 'Organization retrieved successfully', organization);
    } catch (error: any) {
      console.error('Get organization error:', error);
      return sendError(res, 'Failed to get organization', error.message, 500);
    }
  }

  // Get user's organizations
  async getUserOrganizations(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const memberships = await prisma.organizationMember.findMany({
        where: { userId },
        include: {
          organization: {
            include: {
              creator: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true,
                },
              },
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      fullName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const organizations = memberships.map(m => ({
        ...m.organization,
        userRole: m.role,
      }));

      return sendSuccess(res, 'Organizations retrieved successfully', organizations);
    } catch (error: any) {
      console.error('Get user organizations error:', error);
      return sendError(res, 'Failed to get organizations', error.message, 500);
    }
  }

  // Update organization
  async updateOrganization(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;
      const { name, description, avatar, isActive } = req.body;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          members: true,
        },
      });

      if (!organization) {
        return sendError(res, 'Organization not found', 'Organization does not exist', 404);
      }

      // Check if user is admin
      const member = organization.members.find(m => m.userId === userId);
      if (!member || member.role !== 'ADMIN') {
        return sendError(res, 'Unauthorized', 'Only admins can update organization', 403);
      }

      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(avatar && { avatar }),
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      return sendSuccess(res, 'Organization updated successfully', updatedOrganization);
    } catch (error: any) {
      console.error('Update organization error:', error);
      return sendError(res, 'Failed to update organization', error.message, 500);
    }
  }

  // Add member to organization
  async addMember(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;
      const { userId: newMemberId, role } = req.body;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          members: true,
        },
      });

      if (!organization) {
        return sendError(res, 'Organization not found', 'Organization does not exist', 404);
      }

      // Check if requester is admin
      const requesterMember = organization.members.find(m => m.userId === userId);
      if (!requesterMember || requesterMember.role !== 'ADMIN') {
        return sendError(res, 'Unauthorized', 'Only admins can add members', 403);
      }

      // Check if user is already member
      const existingMember = organization.members.find(m => m.userId === newMemberId);
      if (existingMember) {
        return sendError(res, 'Already member', 'User is already a member', 400);
      }

      const newMember = await prisma.organizationMember.create({
        data: {
          organizationId,
          userId: newMemberId,
          role: role || 'MEMBER',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: newMemberId,
          title: 'Added to Organization',
          message: `You have been added to ${organization.name}`,
          type: 'SYSTEM',
          metadata: { organizationId },
        },
      });

      return sendSuccess(res, 'Member added successfully', newMember, 201);
    } catch (error: any) {
      console.error('Add member error:', error);
      return sendError(res, 'Failed to add member', error.message, 500);
    }
  }

  // Remove member from organization
  async removeMember(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { organizationId, memberId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          members: true,
        },
      });

      if (!organization) {
        return sendError(res, 'Organization not found', 'Organization does not exist', 404);
      }

      // Check if requester is admin
      const requesterMember = organization.members.find(m => m.userId === userId);
      if (!requesterMember || requesterMember.role !== 'ADMIN') {
        return sendError(res, 'Unauthorized', 'Only admins can remove members', 403);
      }

      // Cannot remove creator
      if (memberId === organization.creatorId) {
        return sendError(res, 'Invalid request', 'Cannot remove organization creator', 400);
      }

      await prisma.organizationMember.deleteMany({
        where: {
          organizationId,
          userId: memberId,
        },
      });

      return sendSuccess(res, 'Member removed successfully');
    } catch (error: any) {
      console.error('Remove member error:', error);
      return sendError(res, 'Failed to remove member', error.message, 500);
    }
  }

  // Update member role
  async updateMemberRole(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { organizationId, memberId } = req.params;
      const { role } = req.body;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          members: true,
        },
      });

      if (!organization) {
        return sendError(res, 'Organization not found', 'Organization does not exist', 404);
      }

      // Check if requester is admin
      const requesterMember = organization.members.find(m => m.userId === userId);
      if (!requesterMember || requesterMember.role !== 'ADMIN') {
        return sendError(res, 'Unauthorized', 'Only admins can update member roles', 403);
      }

      const member = organization.members.find(m => m.userId === memberId);
      if (!member) {
        return sendError(res, 'Member not found', 'User is not a member', 404);
      }

      const updatedMember = await prisma.organizationMember.update({
        where: { id: member.id },
        data: { role },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
        },
      });

      return sendSuccess(res, 'Member role updated successfully', updatedMember);
    } catch (error: any) {
      console.error('Update member role error:', error);
      return sendError(res, 'Failed to update member role', error.message, 500);
    }
  }

  // Leave organization
  async leaveOrganization(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        return sendError(res, 'Organization not found', 'Organization does not exist', 404);
      }

      // Cannot leave if creator
      if (organization.creatorId === userId) {
        return sendError(res, 'Invalid request', 'Creator cannot leave organization', 400);
      }

      await prisma.organizationMember.deleteMany({
        where: {
          organizationId,
          userId,
        },
      });

      return sendSuccess(res, 'Left organization successfully');
    } catch (error: any) {
      console.error('Leave organization error:', error);
      return sendError(res, 'Failed to leave organization', error.message, 500);
    }
  }

  // Delete organization
  async deleteOrganization(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { organizationId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        return sendError(res, 'Organization not found', 'Organization does not exist', 404);
      }

      if (organization.creatorId !== userId) {
        return sendError(res, 'Unauthorized', 'Only creator can delete organization', 403);
      }

      await prisma.organization.delete({
        where: { id: organizationId },
      });

      return sendSuccess(res, 'Organization deleted successfully');
    } catch (error: any) {
      console.error('Delete organization error:', error);
      return sendError(res, 'Failed to delete organization', error.message, 500);
    }
  }
}