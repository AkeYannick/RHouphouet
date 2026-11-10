import { Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import {
  FiltreDestinataireDto,
  FiltresNotificationsDto,
} from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  lister(@Query() filtres: FiltresNotificationsDto) {
    return this.service.lister(filtres);
  }

  @Get('nombre-non-lues')
  compter(@Query() filtres: FiltreDestinataireDto) {
    return this.service.compterNonLues(filtres.destinataire, filtres.locataireId);
  }

  @Patch('lire-tout')
  marquerToutesLues(@Query() filtres: FiltreDestinataireDto) {
    return this.service.marquerToutesLues(filtres.destinataire, filtres.locataireId);
  }

  @Patch(':id/lire')
  marquerLue(@Param('id') id: string) {
    return this.service.marquerLue(id);
  }

  @Delete(':id')
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(id);
  }
}
