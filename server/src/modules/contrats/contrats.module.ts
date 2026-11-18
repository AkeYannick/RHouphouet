import { Module } from '@nestjs/common';
import { ContratPdfService } from './contrat-pdf.service';
import { ContratsController } from './contrats.controller';
import { ContratsService } from './contrats.service';

@Module({
  controllers: [ContratsController],
  providers: [ContratsService, ContratPdfService],
  exports: [ContratsService],
})
export class ContratsModule {}
