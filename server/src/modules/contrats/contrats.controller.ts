import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ContratsService } from './contrats.service';
import { CreerContratDto, ModifierContratDto } from './dto/contrat.dto';

@Controller('contrats')
export class ContratsController {
  constructor(private readonly service: ContratsService) {}

  @Get()
  lister(
    @Query('statut') statut?: string,
    @Query('locataireId') locataireId?: string,
  ) {
    return this.service.lister({ statut, locataireId });
  }

  @Get(':id')
  trouver(@Param('id') id: string) {
    return this.service.trouver(id);
  }

  @Get(':id/pdf')
  async pdf(@Param('id') id: string): Promise<StreamableFile> {
    const { contenu, nomFichier } = await this.service.pdf(id);

    return new StreamableFile(contenu, {
      type: 'application/pdf',
      disposition: `attachment; filename="${nomFichier}"`,
      length: contenu.length,
    });
  }

  @Post()
  creer(@Body() donnees: CreerContratDto) {
    return this.service.creer(donnees);
  }

  @Patch(':id')
  modifier(@Param('id') id: string, @Body() donnees: ModifierContratDto) {
    return this.service.modifier(id, donnees);
  }

  @Delete(':id')
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(id);
  }
}
