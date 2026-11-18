import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

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
