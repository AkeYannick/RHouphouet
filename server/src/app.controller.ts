import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/public.decorator';

@Controller('sante')
export class SanteController {
  @Public()
  @Get()
  verifier() {
    return {
      statut: 'ok',
      date: new Date().toISOString(),
    };
  }
}
