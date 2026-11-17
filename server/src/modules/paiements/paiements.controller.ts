import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CreerPaiementDto } from './dto/paiement.dto';
import { PaiementsService } from './paiements.service';

@Controller('paiements')
export class PaiementsController {
  constructor(private readonly service: PaiementsService) {}

  @Get()
  lister(
    @Query('locataireId') locataireId?: string,
    @Query('mois') mois?: string,
  ) {
    return this.service.lister({ locataireId, mois });
  }

  @Post()
  creer(@Body() donnees: CreerPaiementDto) {
    return this.service.enregistrer(donnees);
  }

  @Delete(':id')
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(id);
  }
}
