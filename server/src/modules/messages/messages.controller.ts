import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EnvoyerMessageDto } from './dto/message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Get('conversations')
  conversations() {
    return this.service.conversations();
  }

  @Get('locataire/:locataireId')
  listerParLocataire(@Param('locataireId') locataireId: string) {
    return this.service.listerParLocataire(locataireId);
  }

  @Post()
  envoyer(@Body() donnees: EnvoyerMessageDto) {
    return this.service.envoyer(donnees);
  }

  @Patch('locataire/:locataireId/lire')
  marquerLus(
    @Param('locataireId') locataireId: string,
    @Query('lecteur') lecteur = 'ADMIN',
  ) {
    return this.service.marquerLus(locataireId, lecteur);
  }
}
