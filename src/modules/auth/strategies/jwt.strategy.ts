import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UserToken } from '../entities/user-token.entity';
import { User } from '../../users/entities/user.entity';

interface JwtPayload {
  sub: number;
  email: string;
  tokenId: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserToken)
    private tokenRepository: Repository<UserToken>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    // Find the token in the database
    const tokenRecord = await this.tokenRepository.findOne({
      where: {
        id: payload.tokenId,
        accessToken: payload.sub.toString(),
        isRevoked: false,
      },
      relations: ['user'],
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid token');
    }

    // Check if token is expired
    if (new Date() > tokenRecord.accessTokenExpiresAt) {
      throw new UnauthorizedException('Token expired');
    }

    // Return the user
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
