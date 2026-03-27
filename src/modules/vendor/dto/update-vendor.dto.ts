import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, Min } from 'class-validator';

export class UpdateVendorDto {
  @ApiPropertyOptional({ example: 60.5 })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  hourlyRate?: number;

  @ApiPropertyOptional({
    example: { quality: 4.5, communication: 5.0, timeliness: 4.0 },
    type: Object,
  })
  @IsObject()
  @IsOptional()
  scorecard?: Record<string, any>;
}
