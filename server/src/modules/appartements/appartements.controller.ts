import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AppartementsService } from './appartements.service';
import { CreerAppartementDto, ModifierAppartementDto } from './dto/appartement.dto';

@Controller('appartements')
export class AppartementsController {
  constructor(private readonly service: AppartementsService) {}

  @Get()
  lister() {
    return this.service.lister();
  }

  @Get(':id')
  trouver(@Param('id') id: string) {
    return this.service.trouver(id);
  }

  @Post()
  creer(@Body() donnees: CreerAppartementDto) {
    return this.service.creer(donnees);
  }

  @Patch(':id')
  modifier(@Param('id') id: string, @Body() donnees: ModifierAppartementDto) {
    return this.service.modifier(id, donnees);
  }

  @Delete(':id')
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(id);
  }
}
