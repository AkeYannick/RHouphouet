import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { EXPEDITEURS_MESSAGE, type ExpediteurMessage } from '../../../common/enums';

export class EnvoyerMessageDto {
  @IsString({ message: 'Le locataire est obligatoire' })
  @IsNotEmpty({ message: 'Le locataire est obligatoire' })
  @MaxLength(40, { message: "L'identifiant du locataire est invalide" })
  locataireId!: string;

  @IsIn([...EXPEDITEURS_MESSAGE], { message: "L'expéditeur du message est invalide" })
  expediteur!: ExpediteurMessage;

  @IsString({ message: 'Le contenu du message est obligatoire' })
  @IsNotEmpty({ message: 'Le message ne peut pas être vide' })
  @MaxLength(2000, { message: 'Le message ne peut pas dépasser 2000 caractères' })
  contenu!: string;
}
