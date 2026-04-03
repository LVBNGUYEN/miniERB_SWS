import { IsString, IsNotEmpty, IsNumber, Min, IsDateString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProjectStatus } from '../entities/project-status.enum';

export class CreateProjectDto {
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty()
  name: string;

  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedBudget?: number;

  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalEstimatedHours?: number;

  @IsUUID()
  @IsOptional()
  pmId?: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedBudget?: number;

  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalEstimatedHours?: number;
}
