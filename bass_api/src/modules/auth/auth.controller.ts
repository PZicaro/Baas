import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CookieOptions, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AUTH_COOKIE_NAME } from './auth.constants';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registra um novo usuário e inicia a sessão (cookie httpOnly)' })
  @ApiCreatedResponse({ type: UserResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const { accessToken, user } = await this.authService.register(dto);
    this.setAuthCookie(res, accessToken);
    return plainToInstance(UserResponseDto, user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica o usuário e inicia a sessão (cookie httpOnly)' })
  @ApiOkResponse({ type: UserResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const { accessToken, user } = await this.authService.login(dto);
    this.setAuthCookie(res, accessToken);
    return plainToInstance(UserResponseDto, user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encerra a sessão, limpando o cookie httpOnly' })
  logout(@Res({ passthrough: true }) res: Response): { success: true } {
    res.clearCookie(AUTH_COOKIE_NAME, this.cookieOptions());
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Retorna o usuário da sessão atual (via cookie httpOnly)' })
  @ApiOkResponse({ type: UserResponseDto })
  me(@CurrentUser() user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user);
  }

  private setAuthCookie(res: Response, accessToken: string): void {
    res.cookie(AUTH_COOKIE_NAME, accessToken, {
      ...this.cookieOptions(),
      maxAge: this.authService.getCookieMaxAge(accessToken),
    });
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      // Só exige HTTPS em produção; em dev (http://localhost) o navegador
      // descartaria um cookie Secure.
      secure: this.configService.get<string>('env') === 'production',
      sameSite: 'lax',
      path: '/',
    };
  }
}
