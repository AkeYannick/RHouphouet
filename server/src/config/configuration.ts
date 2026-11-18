/**
 * Configuration typée de l'application.
 * Seul cet endroit lit process.env : le reste du code passe par ConfigService.
 */
export interface ConfigurationApplication {
  port: number;
  clientUrl: string;
  exposeOtp: boolean;
  databaseUrl: string | undefined;
  admin: {
    email: string | undefined;
    motDePasse: string | undefined;
  };
  bailleur: {
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
  };
  lieuSignature: string;
}

export default (): ConfigurationApplication => ({
  port: Number(process.env.PORT ?? 5000),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  exposeOtp: process.env.EXPOSE_OTP !== 'false',
  databaseUrl: process.env.DATABASE_URL,
  admin: {
    email: process.env.ADMIN_EMAIL,
    motDePasse: process.env.ADMIN_MOT_DE_PASSE,
  },
  bailleur: {
    nom:
      process.env.BAILLEUR_NOM ??
      'Monsieur HOUPHOUET Kouadio Hénoch Tiburce Eric',
    adresse: process.env.BAILLEUR_ADRESSE ?? 'Abidjan, Côte d’Ivoire',
    telephone: process.env.BAILLEUR_TELEPHONE ?? '',
    email: process.env.BAILLEUR_EMAIL ?? '',
  },
  lieuSignature: process.env.LIEU_SIGNATURE ?? 'Abidjan',
});
