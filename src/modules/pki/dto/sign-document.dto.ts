import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignDocumentDto {
  @ApiProperty({ example: '1', description: 'ID của văn bản cần ký' })
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @ApiProperty({ example: 'Nội dung văn bản để băm (hashing)', required: false })
  @IsString()
  @IsOptional()
  documentContent?: string;
}
