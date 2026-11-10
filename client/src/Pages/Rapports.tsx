import {
  Building2,
  Download,
  FileBarChart,
  HandCoins,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BandeauErreur } from '../components/ui/BandeauErreur';
import { CarteStatistique } from '../components/ui/CarteStatistique';
import { Chargement } from '../components/ui/Chargement';
import { EnTetePage } from '../components/ui/EnTetePage';
import { EtatVide } from '../components/ui/EtatVide';
import { api } from '../services/api';
import type { Charge, Locataire, Loyer } from '../types';
import {
  anneeActuelle,
  formaterDate,
  formaterMontant,
  formaterMois,
} from '../utils/format';

interface LigneRecapitulative {
  locataire: Locataire;
  appartement: string;
  loyerMensuel: number;
  totalDu: number;
  totalRecu: number;
  reste: number;
}

interface LigneMensuelle {
  mois: string;
  revenus: number;
  charges: number;
  benefice: number;
}

const MOIS_ANNEE = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
];

function echapperCsv(valeur: string | number): string {
  let texte = String(valeur);

  // Neutralise les formules Excel (=, +, -, @) issues des noms saisis par l'utilisateur
  if (typeof valeur === 'string' && /^[=+\-@\t\r]/.test(texte)) {
    texte = `'${texte}`;
  }

  return texte.includes(';') || texte.includes('"') || texte.includes('\n')
    ? `"${texte.replace(/"/g, '""')}"`
    : texte;
}

const Rapports = () => {
  const [loyers, setLoyers] = useState<Loyer[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [annee, setAnnee] = useState(anneeActuelle());

  const charger = useCallback(async () => {
    setChargement(true);

    try {
      const [listeLoyers, listeCharges, listeLocataires] = await Promise.all([
        api.loyers.lister(),
        api.charges.lister(),
        api.locataires.lister(true),
      ]);
      setLoyers(listeLoyers);
      setCharges(listeCharges);
      setLocataires(listeLocataires);
      setErreur(null);
    } catch (probleme) {
      setErreur((probleme as Error).message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const anneesDisponibles = useMemo(() => {
    const annees = new Set<number>([anneeActuelle()]);

    loyers.forEach((loyer) => {
      const valeur = Number(loyer.mois.slice(0, 4));
      if (valeur) {
        annees.add(valeur);
      }
    });

    charges.forEach((charge) => {
      const valeur = Number(charge.date.slice(0, 4));
      if (valeur) {
        annees.add(valeur);
      }
    });

    return [...annees].sort((premier, second) => second - premier);
  }, [loyers, charges]);

  const loyersAnnee = useMemo(
    () => loyers.filter((loyer) => loyer.mois.startsWith(`${annee}-`)),
    [loyers, annee],
  );

  const chargesAnnee = useMemo(
    () => charges.filter((charge) => charge.date.startsWith(`${annee}`)),
    [charges, annee],
  );

  const statistiques = useMemo(() => {
    const totalRecu = loyersAnnee.reduce((somme, loyer) => somme + loyer.montantRecu, 0);
    const totalDu = loyersAnnee.reduce((somme, loyer) => somme + loyer.montantDu, 0);
    const totalCharges = chargesAnnee.reduce((somme, charge) => somme + charge.montant, 0);

    return {
      totalRecu,
      totalDu,
      totalCharges,
      benefice: totalRecu - totalCharges,
      reste: Math.max(totalDu - totalRecu, 0),
      tauxRecouvrement: totalDu > 0 ? Math.round((totalRecu / totalDu) * 100) : 0,
    };
  }, [loyersAnnee, chargesAnnee]);

  const evolutionMensuelle = useMemo<LigneMensuelle[]>(() => {
    return MOIS_ANNEE.map((numeroMois) => {
      const cle = `${annee}-${numeroMois}`;
      const revenus = loyersAnnee
        .filter((loyer) => loyer.mois === cle)
        .reduce((somme, loyer) => somme + loyer.montantRecu, 0);
      const depenses = chargesAnnee
        .filter((charge) => charge.date.slice(0, 7) === cle)
        .reduce((somme, charge) => somme + charge.montant, 0);

      return {
        mois: cle,
        revenus,
        charges: depenses,
        benefice: revenus - depenses,
      };
    });
  }, [loyersAnnee, chargesAnnee, annee]);

  const recapitulatif = useMemo<LigneRecapitulative[]>(() => {
    const concernes = locataires.filter(
      (locataire) =>
        locataire.actif || loyersAnnee.some((loyer) => loyer.locataireId === locataire.id),
    );

    return concernes
      .map((locataire) => {
        const loyersLocataire = loyersAnnee.filter(
          (loyer) => loyer.locataireId === locataire.id,
        );
        const totalDu = loyersLocataire.reduce((somme, loyer) => somme + loyer.montantDu, 0);
        const totalRecu = loyersLocataire.reduce((somme, loyer) => somme + loyer.montantRecu, 0);

        return {
          locataire,
          appartement: locataire.appartement?.numero ?? 'Non affecté',
          loyerMensuel: locataire.loyerMensuel,
          totalDu,
          totalRecu,
          reste: Math.max(totalDu - totalRecu, 0),
        };
      })
      .sort((premier, second) => second.totalRecu - premier.totalRecu);
  }, [locataires, loyersAnnee]);

  const revenuMaximal = Math.max(...evolutionMensuelle.map((ligne) => ligne.revenus), 0);

  const exporterCsv = () => {
    const entetes = [
      'Appartement',
      'Locataire',
      'Loyer mensuel (FCFA)',
      'Total dû (FCFA)',
      'Total perçu (FCFA)',
      'Reste à payer (FCFA)',
    ];

    const lignes = recapitulatif.map((ligne) =>
      [
        ligne.appartement,
        ligne.locataire.nom,
        ligne.loyerMensuel,
        ligne.totalDu,
        ligne.totalRecu,
        ligne.reste,
      ]
        .map(echapperCsv)
        .join(';'),
    );

    const contenu = [
      `Rapport financier ${annee}`,
      '',
      entetes.join(';'),
      ...lignes,
      '',
      `Total encaissé;${statistiques.totalRecu}`,
      `Total des charges;${statistiques.totalCharges}`,
      `Bénéfice net;${statistiques.benefice}`,
      `Taux de recouvrement;${statistiques.tauxRecouvrement} %`,
    ].join('\r\n');

    const fichier = new Blob([`\uFEFF${contenu}`], { type: 'text/csv;charset=utf-8;' });
    const adresse = URL.createObjectURL(fichier);
    const lien = document.createElement('a');
    lien.href = adresse;
    lien.download = `rapport-financier-${annee}.csv`;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(adresse);
  };

  const aucunDonnees = loyersAnnee.length === 0 && chargesAnnee.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <EnTetePage
        titre="Rapports financiers"
        description="Analysez les revenus, les charges et la rentabilité de votre parc locatif."
        actions={
          <>
            <select
              className="select select-bordered select-sm w-32"
              value={annee}
              onChange={(evenement) => setAnnee(Number(evenement.target.value))}
              aria-label="Choisir l'année"
            >
              {anneesDisponibles.map((valeur) => (
                <option key={valeur} value={valeur}>
                  {valeur}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-outline btn-sm sm:btn-md"
              onClick={exporterCsv}
              disabled={chargement || recapitulatif.length === 0}
            >
              <Download size={18} />
              Exporter en CSV
            </button>
          </>
        }
      />

      {erreur && <BandeauErreur message={erreur} onReessayer={charger} />}

      {chargement ? (
        <Chargement texte="Calcul des rapports…" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CarteStatistique
              libelle="Total encaissé"
              valeur={formaterMontant(statistiques.totalRecu)}
              detail={`Sur ${annee} · dû : ${formaterMontant(statistiques.totalDu)}`}
              icone={HandCoins}
              ton="succes"
            />
            <CarteStatistique
              libelle="Total des charges"
              valeur={formaterMontant(statistiques.totalCharges)}
              detail={`Sur ${annee}`}
              icone={Receipt}
              ton="erreur"
            />
            <CarteStatistique
              libelle="Bénéfice net"
              valeur={formaterMontant(statistiques.benefice)}
              detail="Encaissements - charges"
              icone={TrendingUp}
              ton={statistiques.benefice >= 0 ? 'primaire' : 'erreur'}
            />
            <CarteStatistique
              libelle="Taux de recouvrement"
              valeur={`${statistiques.tauxRecouvrement} %`}
              detail={`Reste à encaisser : ${formaterMontant(statistiques.reste)}`}
              icone={Wallet}
              ton="alerte"
            />
          </div>

          {aucunDonnees ? (
            <div className="card border border-base-300/70 bg-base-100 shadow-sm">
              <div className="card-body">
                <EtatVide
                  icone={FileBarChart}
                  titre={`Aucune donnée pour ${annee}`}
                  description="Sélectionnez une autre année ou enregistrez des loyers et des charges."
                />
              </div>
            </div>
          ) : (
            <>
              <div className="card border border-base-300/70 bg-base-100 shadow-sm">
                <div className="card-body gap-4 p-4 sm:p-5">
                  <div>
                    <h2 className="text-base font-semibold text-base-content">
                      Évolution mensuelle {annee}
                    </h2>
                    <p className="text-xs text-base-content/60">
                      Encaissements, dépenses et résultat mois par mois.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Mois</th>
                          <th className="text-right">Encaissé</th>
                          <th className="text-right">Charges</th>
                          <th className="text-right">Résultat</th>
                          <th className="hidden sm:table-cell">Tendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evolutionMensuelle.map((ligne) => (
                          <tr key={ligne.mois} className="hover:bg-base-200/40">
                            <td className="whitespace-nowrap text-sm font-medium capitalize">
                              {formaterMois(ligne.mois)}
                            </td>
                            <td className="whitespace-nowrap text-right text-sm text-success">
                              {formaterMontant(ligne.revenus)}
                            </td>
                            <td className="whitespace-nowrap text-right text-sm text-error">
                              {formaterMontant(ligne.charges)}
                            </td>
                            <td
                              className={`whitespace-nowrap text-right text-sm font-semibold ${
                                ligne.benefice >= 0 ? 'text-base-content' : 'text-error'
                              }`}
                            >
                              {formaterMontant(ligne.benefice)}
                            </td>
                            <td className="hidden sm:table-cell">
                              <progress
                                className="progress progress-primary w-full"
                                value={ligne.revenus}
                                max={revenuMaximal || 1}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="card border border-base-300/70 bg-base-100 shadow-sm">
                <div className="card-body gap-4 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-base-content">
                        Récapitulatif par appartement
                      </h2>
                      <p className="text-xs text-base-content/60">
                        Loyers attendus et encaissés sur {annee}.
                      </p>
                    </div>
                    <span className="badge badge-ghost badge-sm">
                      {recapitulatif.length} locataire{recapitulatif.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {recapitulatif.length === 0 ? (
                    <EtatVide
                      icone={Building2}
                      titre="Aucun locataire à afficher"
                      description="Ajoutez des locataires pour générer le récapitulatif par appartement."
                    />
                  ) : (
                    <>
                      <div className="hidden overflow-x-auto lg:block">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Appartement</th>
                              <th>Locataire</th>
                              <th className="text-right">Loyer / mois</th>
                              <th className="text-right">Total dû</th>
                              <th className="text-right">Total perçu</th>
                              <th className="text-right">Reste</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recapitulatif.map((ligne) => (
                              <tr key={ligne.locataire.id} className="hover:bg-base-200/40">
                                <td className="text-sm font-medium">{ligne.appartement}</td>
                                <td className="text-sm text-base-content/80">
                                  {ligne.locataire.nom}
                                </td>
                                <td className="whitespace-nowrap text-right text-sm">
                                  {formaterMontant(ligne.loyerMensuel)}
                                </td>
                                <td className="whitespace-nowrap text-right text-sm">
                                  {formaterMontant(ligne.totalDu)}
                                </td>
                                <td className="whitespace-nowrap text-right text-sm font-semibold text-success">
                                  {formaterMontant(ligne.totalRecu)}
                                </td>
                                <td
                                  className={`whitespace-nowrap text-right text-sm ${
                                    ligne.reste > 0 ? 'font-semibold text-error' : 'text-base-content/50'
                                  }`}
                                >
                                  {formaterMontant(ligne.reste)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-col gap-3 lg:hidden">
                        {recapitulatif.map((ligne) => (
                          <div
                            key={ligne.locataire.id}
                            className="rounded-xl border border-base-300/70 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {ligne.locataire.nom}
                                </p>
                                <p className="text-xs text-base-content/60">
                                  {ligne.appartement} · {formaterMontant(ligne.loyerMensuel)} / mois
                                </p>
                              </div>
                              <span
                                className={`badge badge-sm border-0 ${
                                  ligne.reste > 0 ? 'badge-error' : 'badge-success'
                                }`}
                              >
                                {ligne.reste > 0 ? 'Reste dû' : 'À jour'}
                              </span>
                            </div>

                            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                              <div className="rounded-lg bg-base-200/70 p-2">
                                <dt className="text-[10px] uppercase tracking-wide text-base-content/50">
                                  Dû
                                </dt>
                                <dd className="mt-0.5 text-xs font-semibold">
                                  {formaterMontant(ligne.totalDu)}
                                </dd>
                              </div>
                              <div className="rounded-lg bg-success/10 p-2">
                                <dt className="text-[10px] uppercase tracking-wide text-base-content/50">
                                  Perçu
                                </dt>
                                <dd className="mt-0.5 text-xs font-semibold text-success">
                                  {formaterMontant(ligne.totalRecu)}
                                </dd>
                              </div>
                              <div className="rounded-lg bg-base-200/70 p-2">
                                <dt className="text-[10px] uppercase tracking-wide text-base-content/50">
                                  Reste
                                </dt>
                                <dd
                                  className={`mt-0.5 text-xs font-semibold ${
                                    ligne.reste > 0 ? 'text-error' : 'text-base-content/60'
                                  }`}
                                >
                                  {formaterMontant(ligne.reste)}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="card border border-base-300/70 bg-base-100 shadow-sm">
                <div className="card-body gap-2 p-4 sm:p-5">
                  <h2 className="text-base font-semibold text-base-content">Dernières charges</h2>
                  {chargesAnnee.length === 0 ? (
                    <p className="text-sm text-base-content/60">
                      Aucune charge enregistrée sur {annee}.
                    </p>
                  ) : (
                    <ul className="divide-y divide-base-300/60">
                      {chargesAnnee.slice(0, 5).map((charge) => (
                        <li
                          key={charge.id}
                          className="flex items-center justify-between gap-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{charge.libelle}</p>
                            <p className="text-xs text-base-content/60">
                              {formaterDate(charge.date)}
                              {charge.appartement ? ` · ${charge.appartement.numero}` : ''}
                            </p>
                          </div>
                          <span className="whitespace-nowrap text-sm font-semibold text-error">
                            {formaterMontant(charge.montant)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Rapports;
