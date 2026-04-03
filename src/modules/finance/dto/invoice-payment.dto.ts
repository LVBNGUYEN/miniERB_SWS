import { IsNumber, IsString, IsNotEmpty, Min, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Invoice amount', example: 1500 })
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @IsNotEmpty()
  amount: number;
}

export class RegisterPaymentDto {
  @ApiProperty({ description: 'Payment amount', example: 1500 })
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Payment reference code', example: 'BANK-TRF-123' })
  @IsString()
  @IsNotEmpty()
  reference: string;

  @ApiProperty({ description: 'PKI Payment Signature', example: 'pki_sig_...' })
  @IsString()
  @IsOptional()
  signature?: string;
}
