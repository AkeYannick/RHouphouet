import { Module } from '@nestjs/common';
import { LoyersController } from './loyers.controller';
import { LoyersService } from './loyers.service';

@Module({
  controllers: [LoyersController],
  providers: [LoyersService],
  exports: [LoyersService],
})
export class LoyersModule {}
