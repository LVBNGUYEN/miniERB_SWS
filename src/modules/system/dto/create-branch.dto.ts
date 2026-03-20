import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  currency: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  timezone: string;
}
