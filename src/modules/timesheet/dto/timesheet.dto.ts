import { IsNumber, IsString, IsNotEmpty, IsUUID, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogHoursDto {
  @ApiProperty({ description: 'ID của Task đang thực hiện' })
  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty({ description: 'Số giờ làm việc', example: 4.5 })
  @IsNumber()
  @Min(0.5)
  @Max(24)
  @IsNotEmpty()
  hours: number;

  @ApiProperty({ description: 'Giá snapshot (giá gốc/giờ)', example: 100, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  snapshotPrice?: number;

  @ApiProperty({ description: 'Ghi chú công việc', example: 'Refacting API security', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectTimesheetDto {
  @ApiProperty({ description: 'Lý do từ chối', example: 'Thiếu báo cáo chi tiết' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ClockInDto {
  @ApiProperty({ description: 'ID của Task' })
  @IsUUID()
  @IsNotEmpty()
  taskId: string;
}

export class ClockOutDto {
  @ApiProperty({ description: 'Ghi chú phiên làm việc', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
