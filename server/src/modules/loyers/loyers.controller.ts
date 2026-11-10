import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CreerLoyerDto, GenererLoyersDto, PayerLoyerDto } from './dto/loyer.dto';
import { LoyersService } from './loyers.service';

@Controller('loyers')
export class LoyersController {
  constructor(private readonly service: LoyersService) {}

  @Get()
  lister(
    @Query('statut') statut?: string,
    @Query('mois') mois?: string,
    @Query('locataireId') locataireId?: string,
  ) {
    return this.service.lister({ statut, mois, locataireId });
  }

  @Get(':id')
  trouver(@Param('id') id: string) {
    return this.service.trouver(id);
  }

  @Post()
  creer(@Body() donnees: CreerLoyerDto) {
    return this.service.creer(donnees);
  }

  @Post('generer')
  generer(@Body() donnees: GenererLoyersDto) {
    return this.service.generer(donnees);
  }

  @Post(':id/payer')
  payer(@Param('id') id: string, @Body() donnees: PayerLoyerDto) {
    return this.service.payer(id, donnees);
  }

  @Delete(':id')
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(id);
  }
}
