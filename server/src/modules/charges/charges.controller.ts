import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ChargesService } from './charges.service';
import { CreerChargeDto } from './dto/charge.dto';

@Controller('charges')
export class ChargesController {
  constructor(private readonly service: ChargesService) {}

  @Get()
  lister() {
    return this.service.lister();
  }

  @Post()
  creer(@Body() donnees: CreerChargeDto) {
    return this.service.creer(donnees);
  }

  @Delete(':id')
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(id);
  }
}
