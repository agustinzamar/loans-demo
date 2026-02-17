import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { UserToken } from './entities/user-token.entity';
import { LoginDto } from './dto/login.dto';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserToken)
    private tokenRepository: Repository<UserToken>,
  ) {}

  async login(loginDto: LoginDto): Promise<TokenResponse> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    try {
      // Verify refresh token
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Find token in database
      const tokenRecord = await this.tokenRepository.findOne({
        where: {
          refreshToken: refreshToken,
          isRevoked: false,
        },
        relations: ['user'],
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if refresh token is expired
      if (new Date() > tokenRecord.refreshTokenExpiresAt) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Revoke old token
      tokenRecord.isRevoked = true;
      await this.tokenRepository.save(tokenRecord);

      // Generate new tokens
      return this.generateTokens(tokenRecord.user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(accessToken: string): Promise<void> {
    // Find and revoke the token
    const tokenRecord = await this.tokenRepository.findOne({
      where: { accessToken },
    });

    if (tokenRecord) {
      tokenRecord.isRevoked = true;
      await this.tokenRepository.save(tokenRecord);
    }
  }

  private async generateTokens(user: User): Promise<TokenResponse> {
    // Calculate expiration times
    const now = new Date();
    const accessTokenExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    const refreshTokenExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const accessTokenExpiresAt = this.addTimeToDate(now, accessTokenExpiresIn);
    const refreshTokenExpiresAt = this.addTimeToDate(
      now,
      refreshTokenExpiresIn,
    );

    // Create token record first to get the ID
    const tokenRecord = this.tokenRepository.create({
      userId: user.id,
      accessToken: '', // Will be updated after JWT generation
      refreshToken: '', // Will be updated after JWT generation
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      isRevoked: false,
    });

    const savedToken = await this.tokenRepository.save(tokenRecord);

    // Generate JWT access token
    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      tokenId: savedToken.id,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: accessTokenExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    // Generate JWT refresh token
    const refreshTokenPayload = {
      sub: user.id,
      tokenId: savedToken.id,
      type: 'refresh',
    };

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshTokenExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    // Update token record with actual tokens
    savedToken.accessToken = accessToken;
    savedToken.refreshToken = refreshToken;
    await this.tokenRepository.save(savedToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  private addTimeToDate(date: Date, timeString: string): Date {
    const result = new Date(date);
    const match = timeString.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new BadRequestException(`Invalid time format: ${timeString}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        result.setSeconds(result.getSeconds() + value);
        break;
      case 'm':
        result.setMinutes(result.getMinutes() + value);
        break;
      case 'h':
        result.setHours(result.getHours() + value);
        break;
      case 'd':
        result.setDate(result.getDate() + value);
        break;
      default:
        throw new BadRequestException(`Invalid time unit: ${unit}`);
    }

    return result;
  }
}
