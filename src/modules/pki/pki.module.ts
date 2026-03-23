import { Module } from '@nestjs/common';
import { PkiService } from './services/pki.service';

@Module({
  providers: [PkiService],
  exports: [PkiService],
})
export class PkiModule {}
