import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, Min } from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({ example: 'vendor1@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: ['React', 'NodeJS'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({ example: 50.0 })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  hourlyRate?: number;
}
