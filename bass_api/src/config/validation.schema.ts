import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsString()
  API_PREFIX?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsString()
  DB_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT!: number;

  @IsString()
  DB_USERNAME!: string;

  @IsOptional()
  @IsString()
  DB_PASSWORD?: string;

  @IsString()
  DB_DATABASE!: string;

  @IsOptional()
  @IsBoolean()
  DB_SYNCHRONIZE?: boolean;

  @IsOptional()
  @IsBoolean()
  DB_LOGGING?: boolean;

  @IsString()
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;
}

/**
 * Valida as variáveis de ambiente no bootstrap da aplicação.
 * Faz a aplicação falhar rápido (fail-fast) quando a configuração
 * essencial estiver ausente ou incorreta.
 */
export function validate(config: Record<string, unknown>) {
  const normalized = {
    ...config,
    PORT: config.PORT ? Number(config.PORT) : undefined,
    DB_PORT: config.DB_PORT ? Number(config.DB_PORT) : 3306,
    DB_SYNCHRONIZE: config.DB_SYNCHRONIZE === 'true',
    DB_LOGGING: config.DB_LOGGING === 'true',
  };

  const validatedConfig = plainToInstance(EnvironmentVariables, normalized, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(
      `Configuração de ambiente inválida:\n${errors
        .map((error) => Object.values(error.constraints ?? {}).join(', '))
        .join('\n')}`,
    );
  }

  return validatedConfig;
}
