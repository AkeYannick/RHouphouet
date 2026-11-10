import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DESTINATAIRES_NOTIFICATION,
  type DestinataireNotification,
} from '../../../common/enums';

export class FiltresNotificationsDto {
  @IsOptional()
  @IsIn([...DESTINATAIRES_NOTIFICATION], {
    message: 'Destinataire de notification invalide',
  })
  destinataire?: DestinataireNotification;

  @IsOptional()
  @IsIn(['true', 'false'], { message: 'Le filtre nonLues doit valoir true ou false' })
  nonLues?: string;

  @IsOptional()
  @IsString({ message: "L'identifiant du locataire est invalide" })
  @MaxLength(40, { message: "L'identifiant du locataire est invalide" })
  locataireId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un nombre entier' })
  @Min(1, { message: 'La limite doit être supérieure à zéro' })
  @Max(200, { message: 'La limite ne peut pas dépasser 200' })
  limite?: number;
}

export class FiltreDestinataireDto {
  @IsOptional()
  @IsIn([...DESTINATAIRES_NOTIFICATION], {
    message: 'Destinataire de notification invalide',
  })
  destinataire: DestinataireNotification = 'ADMIN';

  @IsOptional()
  @IsString({ message: "L'identifiant du locataire est invalide" })
  @MaxLength(40, { message: "L'identifiant du locataire est invalide" })
  locataireId?: string;
}
