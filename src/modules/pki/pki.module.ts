import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalSignature } from './entities/digital-signature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DigitalSignature])],
  providers: [],
  exports: [TypeOrmModule],
})
export class PkiModule {}
