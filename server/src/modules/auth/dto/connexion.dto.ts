import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ConnexionDto {
  @IsEmail({}, { message: "L'adresse e-mail est invalide" })
  @MaxLength(254, { message: "L'adresse e-mail est trop longue" })
  email!: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @MaxLength(200, { message: 'Le mot de passe est trop long' })
  motDePasse!: string;
}
