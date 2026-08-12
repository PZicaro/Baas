import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ana.souza@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'S3nhaForte!' })
  @IsString()
  @MinLength(8)
  password: string;
}
