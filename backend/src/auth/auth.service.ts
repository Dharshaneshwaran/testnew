import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const adminEmail = (process.env.ADMIN_EMAIL || 'dharshan@gmail.com').trim();
    const adminPassword = process.env.ADMIN_PASSWORD || '12345678';

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const isAdminRegistration =
      adminEmail.length > 0 && dto.email.toLowerCase() === adminEmail.toLowerCase();

    if (isAdminRegistration && dto.password !== adminPassword) {
      throw new ForbiddenException('Invalid admin registration password');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      email: dto.email,
      name: dto.name,
      passwordHash,
      isAdmin: isAdminRegistration,
      isApproved: isAdminRegistration,
      approvedAt: isAdminRegistration ? new Date() : null,
    });

    if (user.isAdmin) {
      return this.createAuthResponse(user);
    }

    return {
      status: 'pending_approval',
      message: 'Registration successful. Awaiting admin approval.',
    };
  }

  async login(dto: LoginDto) {
    const adminEmail = (process.env.ADMIN_EMAIL || 'dharshan@gmail.com').trim();
    const adminPassword = process.env.ADMIN_PASSWORD || '12345678';

    const isAdminLogin =
      adminEmail.length > 0 &&
      dto.email.toLowerCase() === adminEmail.toLowerCase() &&
      dto.password === adminPassword;

    if (isAdminLogin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const user = await this.usersService.upsertAdminUser({
        email: adminEmail,
        passwordHash,
      });
      return this.createAuthResponse(user);
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isApproved && !user.isAdmin) {
      throw new ForbiddenException('Account pending admin approval');
    }

    return this.createAuthResponse(user);
  }

  async profile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private createAuthResponse(user: {
    id: string;
    email: string;
    name: string | null;
    isAdmin: boolean;
    isApproved: boolean;
    approvedAt: Date | null;
  }) {
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        isApproved: user.isApproved,
        approvedAt: user.approvedAt,
      },
    };
  }
}
