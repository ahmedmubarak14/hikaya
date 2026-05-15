import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@hikaya/database';
import { IsEmail, IsEnum, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class SignUpDto {
  @ApiProperty({ example: 'noor@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'Noor Al-Saadi' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @ApiProperty({ enum: ['en', 'ar'], default: 'en' })
  @IsIn(['en', 'ar'])
  locale: 'en' | 'ar' = 'en';

  @ApiProperty({ enum: UserRole, default: UserRole.CLIENT })
  @IsEnum(UserRole)
  role: UserRole = UserRole.CLIENT;
}

export class SignInDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}
