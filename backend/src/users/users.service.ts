import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isApproved: true,
        approvedAt: true,
        createdAt: true,
      },
    });
  }

  createUser(input: {
    email: string;
    passwordHash: string;
    name?: string;
    isAdmin?: boolean;
    isApproved?: boolean;
    approvedAt?: Date | null;
  }) {
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        isAdmin: input.isAdmin ?? false,
        isApproved: input.isApproved ?? false,
        approvedAt: input.approvedAt ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isApproved: true,
        approvedAt: true,
        createdAt: true,
      },
    });
  }

  listPendingApproval() {
    return this.prisma.user.findMany({
      where: {
        isApproved: false,
        isAdmin: false,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  approveUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isApproved: true,
        approvedAt: true,
      },
    });
  }

  upsertAdminUser(input: { email: string; passwordHash: string }) {
    return this.prisma.user.upsert({
      where: { email: input.email },
      update: {
        passwordHash: input.passwordHash,
        isAdmin: true,
        isApproved: true,
        approvedAt: new Date(),
      },
      create: {
        email: input.email,
        name: 'Admin',
        passwordHash: input.passwordHash,
        isAdmin: true,
        isApproved: true,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isApproved: true,
        approvedAt: true,
      },
    });
  }
}
