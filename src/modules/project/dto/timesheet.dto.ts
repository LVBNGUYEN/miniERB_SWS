import { IsNotEmpty, IsUUID, IsNumber, Min, Max, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTimesheetDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID của Task' })
  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty({ example: '2026-03-27', description: 'Ngày ghi nhận giờ làm' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 4, description: 'Số giờ làm việc (VD: 4.5)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(24, { message: 'Một ngày không được log quá 24 giờ làm việc!' })
  @IsNotEmpty()
  hours: number;

  @ApiProperty({ example: 'Hoàn thành code phân hệ API login', description: 'Nội dung công việc đã làm', required: false })
  @IsString()
  @IsOptional()
  progressNote?: string;
}
