import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreerLocataireDto, ModifierLocataireDto } from './dto/locataire.dto';
import { LocatairesService } from './locataires.service';

@Controller('locataires')
export class LocatairesController {
  constructor(private readonly service: LocatairesService) {}

  @Get()
  lister(@Query('tous') tous?: string) {
    return this.service.lister(tous !== 'true');
  }

  @Get(':id')
  trouver(@Param('id') id: string) {
    return this.service.trouver(id);
  }

  @Post()
  creer(@Body() donnees: CreerLocataireDto) {
    return this.service.creer(donnees);
  }

  @Patch(':id')
  modifier(@Param('id') id: string, @Body() donnees: ModifierLocataireDto) {
    return this.service.modifier(id, donnees);
  }

  @Delete(':id')
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(id);
  }
}
