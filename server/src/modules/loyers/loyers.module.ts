import { Module } from '@nestjs/common';
import { PaiementsModule } from '../paiements/paiements.module';
import { LoyersController } from './loyers.controller';
import { LoyersService } from './loyers.service';

@Module({
  imports: [PaiementsModule],
  controllers: [LoyersController],
  providers: [LoyersService],
  exports: [LoyersService],
})
export class LoyersModule {}
