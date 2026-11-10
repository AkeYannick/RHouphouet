import { Controller, Get } from '@nestjs/common';
import { TableauDeBordService } from './tableau-de-bord.service';

@Controller('tableau-de-bord')
export class TableauDeBordController {
  constructor(private readonly service: TableauDeBordService) {}

  @Get()
  obtenir() {
    return this.service.obtenir();
  }
}
