import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';

export interface ContratDocument {
  numero: string;
  dateDebut: Date;
  dateFin: Date | null;
  loyerMensuel: number;
  caution: number;
  chargesMensuelles: number;
  statut: string;
  clauses: string | null;
  creeLe: Date;
  locataire: {
    nom: string;
    telephone: string;
    email: string | null;
  };
  appartement: {
    numero: string;
    designation: string | null;
    nombrePieces: number;
  } | null;
}

export interface PdfContrat {
  contenu: Buffer;
  nomFichier: string;
}

const BLEU_PROFOND = '#0B3A5C';
const BLEU = '#2E6BE6';
const GRIS = '#5B6573';
const GRIS_CLAIR = '#98A2B3';
const BORDURE = '#DDE3EC';
const FOND = '#F2F5FA';

const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const CLAUSES_STANDARD: Array<{ titre: string; texte: string }> = [
  {
    titre: 'Usage des lieux',
    texte:
      "Le Preneur ne pourra donner au local loué d'autre usage que celui d'habitation, à l'exclusion de tout autre, même temporairement.",
  },
  {
    titre: 'État des lieux',
    texte:
      "Le Preneur occupera les lieux loués dans l'état où ils se trouveront au moment de l'entrée en jouissance, sans pouvoir exercer aucun recours contre le Bailleur pour vice de construction, dégradation, voiries, cas de force majeure ou toutes autres causes quelconques intéressant l'état des lieux.",
  },
  {
    titre: 'Entretien et réparations locatives',
    texte:
      "Le Preneur entretiendra les lieux loués en bon état de réparations locatives, en jouira en bon père de famille et les restituera en bon état en fin de contrat. Il devra notamment refaire les badigeons, peintures des boiseries, portes, persiennes et plafonnages aussi souvent que besoin sera. À défaut d'entretien, le Bailleur pourra y faire procéder aux frais du Preneur. Le Bailleur ne sera tenu d'exécuter au cours du bail que les grosses réparations qui pourraient devenir nécessaires. Les bris de glace, quelle qu'en soit la cause, resteront à la charge du Preneur. Dans le cas où le Preneur aurait négligé de faire dresser l'état des lieux, ceux-ci seront réputés avoir été pris en bon état d'entretien. Un mois avant l'expiration de la location, le Preneur devra faire établir, contradictoirement avec le Bailleur, un état des réparations lui incombant.",
  },
  {
    titre: 'Grosses réparations',
    texte:
      "Le Preneur souffrira les grosses réparations et toutes transformations nécessaires que le Bailleur jugerait utiles d'effectuer dans le cours du bail, quelles qu'en soient la durée et l'importance. Il devra laisser les ouvriers pénétrer dans les lieux loués pour tous travaux jugés utiles par le Bailleur. Si les réparations durent plus de quarante (40) jours, le prix du bail sera diminué à proportion du temps et de la partie de la chose louée dont il aura été privé.",
  },
  {
    titre: 'Aménagements et transformations',
    texte:
      "Le Preneur ne pourra faire aucun aménagement, aucune modification ou transformation dans l'état ou la disposition du local sans l'autorisation préalable, expresse et écrite du Bailleur. Tous aménagements, embellissements, améliorations ou constructions nouvelles, meubles fixés au mur, au sol ou au plafond, appartiendront de plein droit au Bailleur en fin de bail sans aucune indemnité, à moins que le Bailleur ne préfère la remise en état des lieux aux frais du Preneur.",
  },
  {
    titre: 'Règlements urbains',
    texte:
      "Le Preneur satisfera, aux lieu et place du Bailleur, à toutes les prescriptions de police, de voierie et d'hygiène. Il exécutera à ses frais, sans recours contre le Bailleur, tous travaux qui sont ou seront exigés par les lois, décrets, arrêtés ou règlements relatifs à la santé publique, de manière que le Bailleur ne soit jamais inquiété à ce sujet.",
  },
  {
    titre: 'Cession de bail et sous-location',
    texte:
      "La présente location a été consentie au Preneur intuitu personae. Toute cession de bail, sous-location ou simple occupation des lieux par un tiers est rigoureusement interdite sous peine de résiliation immédiate du présent bail, à la simple constatation de l'infraction.",
  },
  {
    titre: 'Visite des lieux',
    texte:
      "Le Preneur devra laisser le Bailleur ou son représentant visiter les lieux loués chaque fois qu'il le jugera utile, à charge pour ce dernier de le prévenir au moins vingt-quatre (24) heures à l'avance. En cas de mise en vente de l'immeuble ou en vue de la relocation, le Preneur devra laisser visiter acquéreurs et locataires éventuels les lieux loués.",
  },
  {
    titre: 'Réglementations diverses',
    texte:
      "Le Preneur ne pourra demander aucune indemnité ou diminution de loyer en raison de travaux occasionnés par une circonstance fortuite, étrangère au Bailleur. Le Preneur s'engage formellement à appliquer les règlements de la résidence établis ou qui pourraient l'être par le Bailleur.",
  },
  {
    titre: 'Accès et parties communes',
    texte:
      "Le Preneur s'assurera de ne déposer aucuns matériaux, caisses, emballages, objets de toute nature et détritus dans les parties de la résidence communes à tous les locataires. Il entretiendra les accès et les alentours des locaux, qui doivent être toujours décemment occupés.",
  },
  {
    titre: 'Remise des clés',
    texte:
      "Le jour de l'expiration de la location, le Preneur devra remettre au Bailleur les clés du local. Dans le cas où, par le fait du Preneur, le Bailleur n'aurait pu remettre les lieux en location, le Preneur serait redevable d'une indemnité libératoire égale à un terme de loyer.",
  },
  {
    titre: 'Dégradations et vols',
    texte:
      "Le Preneur est responsable de toutes dégradations ou vols quelconques qui pourraient être commis dans et sur les locaux loués par lui ou par les personnes vivant sous son toit.",
  },
];

function montantFcfa(valeur: number): string {
  const entier = Math.round(Number.isFinite(valeur) ? valeur : 0);
  return `${String(entier).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
}

function dateLongue(date: Date): string {
  const jour = date.getDate().toString().padStart(2, '0');
  return `${jour} ${MOIS[date.getMonth()]} ${date.getFullYear()}`;
}

function dureeEnMois(debut: Date, fin: Date): number {
  const jours = Math.max(1, Math.round((fin.getTime() - debut.getTime()) / 86_400_000));
  return Math.max(1, Math.round(jours / 30.4375));
}

@Injectable()
export class ContratPdfService {
  private readonly bailleurNom: string;
  private readonly bailleurAdresse: string;
  private readonly bailleurTelephone: string;
  private readonly bailleurEmail: string;
  private readonly lieuSignature: string;

  constructor(configuration: ConfigService) {
    this.bailleurNom =
      configuration.get<string>('bailleur.nom') ??
      'Monsieur HOUPHOUET Kouadio Hénoch Tiburce Eric';
    this.bailleurAdresse =
      configuration.get<string>('bailleur.adresse') ?? 'Abidjan, Côte d’Ivoire';
    this.bailleurTelephone = configuration.get<string>('bailleur.telephone') ?? '';
    this.bailleurEmail = configuration.get<string>('bailleur.email') ?? '';
    this.lieuSignature = configuration.get<string>('lieuSignature') ?? 'Abidjan';
  }

  async generer(contrat: ContratDocument): Promise<PdfContrat> {
    const document = new PDFDocument({
      size: 'A4',
      margins: { top: 48, bottom: 64, left: 54, right: 54 },
      bufferPages: true,
      info: {
        Title: `Contrat de bail ${contrat.numero}`,
        Author: this.bailleurNom,
        Subject: `Bail d'habitation - ${contrat.locataire.nom}`,
        Keywords: 'contrat, bail, location, FCFA',
      },
    });

    const morceaux: Buffer[] = [];
    document.on('data', (morceau: Buffer) => morceaux.push(morceau));

    const termine = new Promise<Buffer>((resoudre, rejeter) => {
      document.on('end', () => resoudre(Buffer.concat(morceaux)));
      document.on('error', rejeter);
    });

    this.dessiner(document, contrat);
    document.end();

    return {
      contenu: await termine,
      nomFichier: `contrat-${contrat.numero.replace(/[^A-Za-z0-9-]/g, '')}.pdf`,
    };
  }

  private dessiner(document: PDFKit.PDFDocument, contrat: ContratDocument): void {
    const largeur =
      document.page.width - document.page.margins.left - document.page.margins.right;
    const margeGauche = document.page.margins.left;

    this.entete(document, contrat, largeur, margeGauche);
    this.parties(document, contrat, largeur, margeGauche);
    this.designation(document, contrat);
    this.duree(document, contrat);

    this.section(document, 'CLAUSES ET CONDITIONS');
    this.paragraphe(
      document,
      "Le présent bail est fait aux clauses et conditions suivantes que le Preneur s'oblige à exécuter sans qu'il puisse réclamer aucune diminution du loyer ci-après fixé et à peine de résiliation sur simple constatation des infractions s'il plaît au Bailleur.",
    );

    let numero = 1;
    for (const clause of CLAUSES_STANDARD) {
      this.clause(document, numero++, clause.titre, clause.texte);
    }

    const nombreMoisCaution = Math.max(1, Math.round(contrat.caution / contrat.loyerMensuel));
    this.clause(
      document,
      numero++,
      'Garantie',
      `À titre de provision pour la garantie de l'exécution des clauses du présent contrat, le Preneur verse au moment de la signature la somme de ${montantFcfa(
        contrat.caution,
      )}, correspondant à environ ${nombreMoisCaution} mois de loyer. Cette somme sera remboursée au Preneur à l'expiration de la location, lors de la remise des clés et des locaux à la disposition du Bailleur, déduction faite de toutes les sommes qui pourraient être dues par le Preneur, tant pour réparations que pour factures en cours ou toute autre cause. Ce dépôt de garantie demeurera improductif d'intérêts et sera rajusté aux mêmes époques et dans les mêmes proportions que le loyer.`,
    );

    this.clause(
      document,
      numero++,
      'Frais',
      "Tous les frais, droits de timbre, d'enregistrement et honoraires auxquels pourraient donner lieu le présent acte et ses suites seront supportés par le Preneur et sont payables d'avance.",
    );

    this.prix(document, contrat, numero++);

    this.clause(
      document,
      numero++,
      'Clause résolutoire',
      "À défaut de paiement d'un seul terme de loyer à son échéance ou d'exécution d'une quelconque des clauses et conditions du bail, le présent contrat sera résilié de plein droit si bon semble au Bailleur et sans formalités judiciaires, huit (8) jours après une simple mise en demeure de payer ou de remplir les conditions du bail, demeurée sans effet.",
    );

    this.clause(
      document,
      numero++,
      'Élection de domicile',
      "Pour l'exécution des présentes, les parties font élection de domicile entraînant attribution de juridiction : le Bailleur à son domicile, le Preneur au domicile loué. En cas de différend ou de litige que les parties ne parviendraient pas à résoudre à l'amiable dans un délai de trente (30) jours, le Tribunal du Commerce d'Abidjan sera seul compétent pour trancher le litige en dernier ressort.",
    );

    this.clausesParticulieres(document, contrat);
    this.signatures(document, contrat, largeur, margeGauche);
    this.piedsDePage(document, contrat, largeur, margeGauche);
  }

  private entete(
    document: PDFKit.PDFDocument,
    contrat: ContratDocument,
    largeur: number,
    margeGauche: number,
  ): void {
    document.rect(margeGauche, 44, 4, 32).fill(BLEU);

    document
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(BLEU_PROFOND)
      .text('RÉSIDENCE HOUPHOUËT', margeGauche + 14, 46, { lineBreak: false });

    document
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(GRIS)
      .text('Gestion locative · Contrat de bail', margeGauche + 14, 65, {
        lineBreak: false,
      });

    document
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(GRIS)
      .text(contrat.numero, margeGauche, 47, { width: largeur, align: 'right' });

    document
      .font('Helvetica')
      .fontSize(8)
      .fillColor(GRIS_CLAIR)
      .text(`Édité le ${dateLongue(contrat.creeLe)}`, margeGauche, 64, {
        width: largeur,
        align: 'right',
      });

    document
      .moveTo(margeGauche, 92)
      .lineTo(margeGauche + largeur, 92)
      .lineWidth(1)
      .strokeColor(BORDURE)
      .stroke();

    document.y = 112;

    document
      .font('Helvetica-Bold')
      .fontSize(17)
      .fillColor(BLEU_PROFOND)
      .text("CONTRAT DE BAIL À USAGE D'HABITATION", { width: largeur, align: 'center' });

    document
      .moveDown(0.35)
      .font('Helvetica')
      .fontSize(9)
      .fillColor(GRIS)
      .text(`Bail d'habitation · ${this.lieuSignature}`, { width: largeur, align: 'center' });

    document.moveDown(1.1);
  }

  private parties(
    document: PDFKit.PDFDocument,
    contrat: ContratDocument,
    largeur: number,
    margeGauche: number,
  ): void {
    this.section(document, 'ENTRE LES SOUSSIGNÉS');

    document
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(BLEU)
      .text('LE BAILLEUR');

    document
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(BLEU_PROFOND)
      .text(this.bailleurNom);

    const coordonneesBailleur = [this.bailleurAdresse];
    if (this.bailleurTelephone) coordonneesBailleur.push(`Tél. ${this.bailleurTelephone}`);
    if (this.bailleurEmail) coordonneesBailleur.push(this.bailleurEmail);

    document
      .font('Helvetica')
      .fontSize(9)
      .fillColor(GRIS)
      .text(coordonneesBailleur.join(' · '), { width: largeur * 0.78 });

    document
      .font('Helvetica-Oblique')
      .fontSize(8)
      .fillColor(GRIS_CLAIR)
      .text("D'une part", { width: largeur, align: 'right' });

    document.moveDown(0.9);

    document
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(GRIS_CLAIR)
      .text('ET', { width: largeur, align: 'center' });

    document.moveDown(0.7);

    document
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(BLEU)
      .text('LE PRENEUR');

    document
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(BLEU_PROFOND)
      .text(contrat.locataire.nom);

    const coordonneesPreneur = [`Tél. ${contrat.locataire.telephone}`];
    if (contrat.locataire.email) coordonneesPreneur.push(contrat.locataire.email);

    document
      .font('Helvetica')
      .fontSize(9)
      .fillColor(GRIS)
      .text(coordonneesPreneur.join(' · '), { width: largeur * 0.78 });

    document
      .font('Helvetica-Oblique')
      .fontSize(8)
      .fillColor(GRIS_CLAIR)
      .text("D'autre part", { width: largeur, align: 'right' });

    document.moveDown(1);

    this.paragraphe(
      document,
      "Il a été convenu et arrêté ce qui suit. Le Bailleur loue par les présentes au Preneur, qui accepte, le local dont la désignation suit.",
    );
  }

  private designation(document: PDFKit.PDFDocument, contrat: ContratDocument): void {
    this.section(document, 'DÉSIGNATION DU LOGEMENT');

    const nombrePieces = contrat.appartement?.nombrePieces ?? 1;
    const type = nombrePieces > 1 ? `T${nombrePieces}` : 'studio';
    const numero = contrat.appartement?.numero ?? 'non renseigné';
    const details = contrat.appartement?.designation?.trim();

    const description = details
      ? `Un logement de type ${type}, portant le numéro ${numero}, ainsi désigné : ${details}.`
      : `Un logement de type ${type}, portant le numéro ${numero}.`;

    this.paragraphe(document, description);

    this.paragraphe(
      document,
      "Le Preneur déclare avoir vu, visité et parfaitement connu le local loué, qu'il consent à occuper dans son état actuel, tel que tout se poursuit et se comporte sans plus ample description.",
    );
  }

  private duree(document: PDFKit.PDFDocument, contrat: ContratDocument): void {
    this.section(document, 'DURÉE');

    if (!contrat.dateFin) {
      this.paragraphe(
        document,
        `Le présent bail est conclu pour une durée indéterminée à compter du ${dateLongue(
          contrat.dateDebut,
        )}. Il pourra être dénoncé par l'une des parties avec un préavis de trois (3) mois.`,
      );
      return;
    }

    const mois = dureeEnMois(contrat.dateDebut, contrat.dateFin);

    this.paragraphe(
      document,
      `Le présent bail est fait pour durer ${mois} mois, à partir du ${dateLongue(
        contrat.dateDebut,
      )} et jusqu'au ${dateLongue(
        contrat.dateFin,
      )}, renouvelable par tacite reconduction pour des périodes successives de douze (12) mois chacune, sauf dénonciation contraire de l'une des deux parties, trois (3) mois avant l'échéance en cours.`,
    );
  }

  private prix(
    document: PDFKit.PDFDocument,
    contrat: ContratDocument,
    numero: number,
  ): void {
    this.section(document, 'PRIX');

    const total = contrat.loyerMensuel + contrat.chargesMensuelles;

    document
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(BLEU_PROFOND)
      .text(`${numero}. Prix — `, { continued: true });

    document
      .font('Helvetica')
      .fillColor('#39414D')
      .text(
        `Le présent bail est consenti et accepté moyennant le loyer mensuel de ${montantFcfa(
          contrat.loyerMensuel,
        )}, payable d'avance, au plus tard le 05 de chaque mois, en bonnes espèces de monnaies.`,
        { align: 'justify', lineGap: 2.5 },
      );

    document.moveDown(0.7);

    if (contrat.chargesMensuelles > 0) {
      this.paragraphe(
        document,
        `S'y ajoutent des charges mensuelles de ${montantFcfa(
          contrat.chargesMensuelles,
        )}, soit un total mensuel de ${montantFcfa(total)}.`,
      );
    }

    this.paragraphe(
      document,
      "Les deux parties conviennent que le loyer ci-dessus payé sera révisable tous les trois (3) ans, conformément aux dispositions de la loi n° 2018-575 du 13 juin 2018 relative au bail à usage d'habitation.",
    );

    document.moveDown(0.6);

    const largeur =
      document.page.width - document.page.margins.left - document.page.margins.right;
    const x = document.page.margins.left;
    const hauteur = 26;

    const lignes: Array<[string, string]> = [
      ['Loyer mensuel', montantFcfa(contrat.loyerMensuel)],
      ['Charges mensuelles', montantFcfa(contrat.chargesMensuelles)],
      ['Total mensuel', montantFcfa(total)],
      ['Dépôt de garantie', montantFcfa(contrat.caution)],
    ];

    this.assurerEspace(document, hauteur * lignes.length + 10);

    const debutY = document.y;

    lignes.forEach(([libelle, valeur], index) => {
      const ligneY = debutY + index * hauteur;

      if (index % 2 === 0) {
        document.rect(x, ligneY, largeur, hauteur).fill(FOND);
      }

      document
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor(GRIS)
        .text(libelle, x + 10, ligneY + 8, { lineBreak: false });

      document
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor(BLEU_PROFOND)
        .text(valeur, x, ligneY + 8, { width: largeur - 10, align: 'right' });
    });

    document.y = debutY + hauteur * lignes.length + 12;
  }

  private clausesParticulieres(
    document: PDFKit.PDFDocument,
    contrat: ContratDocument,
  ): void {
    const clauses = contrat.clauses?.trim();

    if (!clauses) return;

    this.section(document, 'CLAUSES PARTICULIÈRES');
    this.paragraphe(document, clauses);
  }

  private signatures(
    document: PDFKit.PDFDocument,
    contrat: ContratDocument,
    largeur: number,
    margeGauche: number,
  ): void {
    this.assurerEspace(document, 150);

    document.moveDown(1);

    this.paragraphe(
      document,
      `Fait en trois exemplaires et de bonne foi, à ${this.lieuSignature}, le ${dateLongue(
        contrat.creeLe,
      )}.`,
    );

    const colonne = largeur / 2 - 12;
    const y = document.y + 14;
    const xDroite = margeGauche + largeur / 2 + 12;

    document
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(BLEU_PROFOND)
      .text('Le Bailleur', margeGauche, y, { width: colonne });

    document
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(GRIS)
      .text(this.bailleurNom, margeGauche, y + 14, { width: colonne });

    document
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(BLEU_PROFOND)
      .text('Le Preneur', xDroite, y, { width: colonne });

    document
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(GRIS)
      .text(contrat.locataire.nom, xDroite, y + 14, { width: colonne });

    const yLigne = y + 70;

    document
      .moveTo(margeGauche, yLigne)
      .lineTo(margeGauche + colonne * 0.8, yLigne)
      .lineWidth(0.8)
      .strokeColor(GRIS_CLAIR)
      .stroke();

    document
      .moveTo(xDroite, yLigne)
      .lineTo(xDroite + colonne * 0.8, yLigne)
      .lineWidth(0.8)
      .strokeColor(GRIS_CLAIR)
      .stroke();

    document
      .font('Helvetica-Oblique')
      .fontSize(8)
      .fillColor(GRIS_CLAIR)
      .text('Signature', margeGauche, yLigne + 6, { width: colonne });

    document.text('Signature', xDroite, yLigne + 6, { width: colonne });

    document.y = yLigne + 30;
  }

  private piedsDePage(
    document: PDFKit.PDFDocument,
    contrat: ContratDocument,
    largeur: number,
    margeGauche: number,
  ): void {
    const pages = document.bufferedPageRange();

    for (let index = pages.start; index < pages.start + pages.count; index += 1) {
      document.switchToPage(index);

      const margeBasse = document.page.margins.bottom;
      document.page.margins.bottom = 0;

      const y = document.page.height - 36;

      document
        .moveTo(margeGauche, y - 10)
        .lineTo(margeGauche + largeur, y - 10)
        .lineWidth(0.8)
        .strokeColor(BORDURE)
        .stroke();

      document
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(GRIS_CLAIR)
        .text(
          `Contrat ${contrat.numero} · ${contrat.locataire.nom}`,
          margeGauche,
          y,
          { width: largeur / 2, align: 'left', lineBreak: false },
        );

      document.text(`Page ${index + 1} / ${pages.count}`, margeGauche + largeur / 2, y, {
        width: largeur / 2,
        align: 'right',
        lineBreak: false,
      });

      document.page.margins.bottom = margeBasse;
    }
  }

  private section(document: PDFKit.PDFDocument, titre: string): void {
    this.assurerEspace(document, 54);

    document
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(BLEU)
      .text(titre.toUpperCase());

    document.moveDown(0.25);

    document
      .moveTo(document.page.margins.left, document.y)
      .lineTo(document.page.width - document.page.margins.right, document.y)
      .lineWidth(0.7)
      .strokeColor(BORDURE)
      .stroke();

    document.moveDown(0.7);
  }

  private paragraphe(document: PDFKit.PDFDocument, texte: string): void {
    document
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor('#39414D')
      .text(texte, { align: 'justify', lineGap: 2.5 });

    document.moveDown(0.7);
  }

  private clause(
    document: PDFKit.PDFDocument,
    numero: number,
    titre: string,
    texte: string,
  ): void {
    this.assurerEspace(document, 42);

    document
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(BLEU_PROFOND)
      .text(`${numero}. ${titre} — `, { continued: true });

    document
      .font('Helvetica')
      .fillColor('#39414D')
      .text(texte, { align: 'justify', lineGap: 2.5 });

    document.moveDown(0.65);
  }

  private assurerEspace(document: PDFKit.PDFDocument, hauteur: number): void {
    const basPage = document.page.height - document.page.margins.bottom;

    if (document.y + hauteur > basPage) {
      document.addPage();
    }
  }
}
