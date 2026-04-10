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
        createdAt: true,
      },
    });
  }

  createUser(input: { email: string; passwordHash: string; name?: string }) {
    return this.prisma.user.create({
      data: input,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }
}
