import { IsString, IsNotEmpty, IsUUID, IsNumber, Min, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../entities/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID dự án' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'ID của Vendor (người thực hiện)', required: false })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @ApiProperty({ example: 'Xây dựng API đăng nhập' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Viết API cho việc đăng nhập hệ thống ERP', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2025-12-31T23:59:59.000Z', required: false })
  @IsDateString()
  @IsOptional()
  deadline?: Date;

  @ApiProperty({ example: 40, description: 'Số giờ làm việc dự kiến', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedHours?: number;
}

export class UpdateTaskDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', required: false })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID dự án', required: false })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ example: 'Cập nhật API đăng nhập', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Update bug fix', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2025-12-31T23:59:59.000Z', required: false })
  @IsDateString()
  @IsOptional()
  deadline?: Date;

  @ApiProperty({ example: 45, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedHours?: number;

  @ApiProperty({ enum: TaskStatus, required: false })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
