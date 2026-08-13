import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalResponseDto } from './dto/withdrawal-response.dto';
import { WithdrawalsService } from './withdrawals.service';

@ApiTags('withdrawals')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @ApiOperation({ summary: 'Solicita um saque (POST /api/withdrawals)' })
  @ApiCreatedResponse({ type: WithdrawalResponseDto })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateWithdrawalDto,
  ): Promise<WithdrawalResponseDto> {
    const withdrawal = await this.withdrawalsService.create(user.id, dto);
    return plainToInstance(WithdrawalResponseDto, withdrawal);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os saques do lojista logado' })
  @ApiOkResponse({ type: WithdrawalResponseDto, isArray: true })
  async findAll(@CurrentUser() user: User): Promise<WithdrawalResponseDto[]> {
    const withdrawals = await this.withdrawalsService.findAllForUser(user.id);
    return withdrawals.map((w) => plainToInstance(WithdrawalResponseDto, w));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta o status do saque no gateway (GET /api/withdrawals/:id)' })
  @ApiOkResponse({ type: WithdrawalResponseDto })
  async checkStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WithdrawalResponseDto> {
    const withdrawal = await this.withdrawalsService.checkStatus(user.id, id);
    return plainToInstance(WithdrawalResponseDto, withdrawal);
  }
}
