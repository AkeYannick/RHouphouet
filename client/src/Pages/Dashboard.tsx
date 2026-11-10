import {
  ArrowRight,
  Building2,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  Plus,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeStatutAppartement, BadgeStatutLoyer } from '../components/ui/Badges';
import { BandeauErreur } from '../components/ui/BandeauErreur';
import { CarteStatistique } from '../components/ui/CarteStatistique';
import { EnTetePage } from '../components/ui/EnTetePage';
import { EtatVide } from '../components/ui/EtatVide';
import { api } from '../services/api';
import type { EvolutionMensuelle, TableauDeBord } from '../types';
import {
  formaterDate,
  formaterMontant,
  formaterMois,
  formaterMoisCourt,
} from '../utils/format';

function GraphiqueEvolution({ donnees }: { donnees: EvolutionMensuelle[] }) {
  const maximum = Math.max(...donnees.map((mois) => Math.max(mois.revenus, mois.charges)), 1);

  return (
    <div>
      <div className="flex items-end gap-2 overflow-x-auto pb-1 sm:gap-4">
        {donnees.map((mois) => (
          <div key={mois.mois} className="flex min-w-10 flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end justify-center gap-1 sm:gap-1.5">
              <div
                className="w-1/3 rounded-t-md bg-primary/80 transition-all"
                style={{ height: `${Math.max((mois.revenus / maximum) * 100, 2)}%` }}
                title={`Revenus : ${formaterMontant(mois.revenus)}`}
              />
              <div
                className="w-1/3 rounded-t-md bg-warning/80 transition-all"
                style={{ height: `${Math.max((mois.charges / maximum) * 100, 2)}%` }}
                title={`Charges : ${formaterMontant(mois.charges)}`}
              />
            </div>
            <span className="text-[10px] font-medium capitalize text-base-content/50 sm:text-xs">
              {formaterMoisCourt(mois.mois)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-base-content/60">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/80" /> Revenus encaissés
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-warning/80" /> Charges
        </span>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const [donnees, setDonnees] = useState<TableauDeBord | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);

    try {
      const resultat = await api.tableauDeBord.obtenir();
      setDonnees(resultat);
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

  if (chargement && !donnees) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-9 w-72 rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <EnTetePage
        titre="Tableau de bord"
        description={`Situation au ${new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'long',
        }).format(new Date())}`}
        actions={
          <>
            <Link to="/Rapports" className="btn btn-ghost btn-sm gap-2">
              Voir les rapports
              <ArrowRight size={16} />
            </Link>
            <Link to="/Loyers" className="btn btn-primary btn-sm gap-2">
              <Plus size={16} />
              Enregistrer un paiement
            </Link>
          </>
        }
      />

      {erreur && <BandeauErreur message={erreur} onReessayer={() => void charger()} />}

      {donnees && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CarteStatistique
              libelle="Revenus du mois"
              valeur={formaterMontant(donnees.revenusMois)}
              detail={`${formaterMontant(donnees.montantAttendu)} encore attendus`}
              icone={Wallet}
              ton="primaire"
            />
            <CarteStatistique
              libelle="Taux d'occupation"
              valeur={`${donnees.tauxOccupation} %`}
              detail={`${donnees.appartementsOccupes}/${donnees.nombreAppartements} appartements occupés`}
              icone={Building2}
              ton="succes"
            />
            <CarteStatistique
              libelle="Charges du mois"
              valeur={formaterMontant(donnees.chargesMois)}
              detail={`${donnees.nombreLocatairesActifs} locataire(s) actif(s)`}
              icone={ReceiptText}
              ton="alerte"
            />
            <CarteStatistique
              libelle="Bénéfice net"
              valeur={formaterMontant(donnees.beneficeMois)}
              detail="Revenus encaissés - charges"
              icone={donnees.beneficeMois >= 0 ? TrendingUp : TrendingDown}
              ton={donnees.beneficeMois >= 0 ? 'succes' : 'erreur'}
            />
          </div>

          {donnees.montantEnRetard > 0 && (
            <div className="alert alert-warning alert-soft">
              <CircleAlert size={18} />
              <span className="text-sm">
                {formaterMontant(donnees.montantEnRetard)} restent à recouvrer sur{' '}
                {donnees.loyersEnRetard} loyer(s) en retard.
              </span>
              <Link to="/Loyers" className="btn btn-sm">
                Voir les loyers
              </Link>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-3">
            <section className="card border border-base-300/70 bg-base-100 shadow-sm xl:col-span-2">
              <div className="card-body p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Évolution sur 6 mois</h2>
                    <p className="text-xs text-base-content/50">Revenus encaissés et charges</p>
                  </div>
                  <span className="badge badge-ghost badge-sm capitalize">
                    {formaterMois(donnees.mois)}
                  </span>
                </div>
                <GraphiqueEvolution donnees={donnees.evolutionMensuelle} />
              </div>
            </section>

            <section className="card border border-base-300/70 bg-base-100 shadow-sm">
              <div className="card-body p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Occupation</h2>
                  <span className="text-sm font-semibold text-primary">
                    {donnees.tauxOccupation} %
                  </span>
                </div>

                <progress
                  className="progress progress-primary mt-1 w-full"
                  value={donnees.tauxOccupation}
                  max={100}
                />

                <ul className="mt-3 space-y-2">
                  {donnees.appartements.map((appartement) => (
                    <li
                      key={appartement.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-base-200/50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{appartement.numero}</p>
                        <p className="truncate text-xs text-base-content/50">
                          {appartement.locataire ?? 'Aucun locataire'}
                        </p>
                      </div>
                      <BadgeStatutAppartement statut={appartement.statut} />
                    </li>
                  ))}
                </ul>

                <Link to="/Apparts" className="btn btn-ghost btn-sm mt-2 justify-between">
                  Gérer les appartements
                  <ArrowRight size={15} />
                </Link>
              </div>
            </section>

            <section className="card border border-base-300/70 bg-base-100 shadow-sm xl:col-span-2">
              <div className="card-body p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Prochains paiements</h2>
                    <p className="text-xs text-base-content/50">
                      Loyers en attente, partiels ou en retard
                    </p>
                  </div>
                  <Link to="/Loyers" className="btn btn-ghost btn-xs gap-1 text-primary">
                    Tout voir
                    <ChevronRight size={14} />
                  </Link>
                </div>

                {donnees.prochainsPaiements.length === 0 ? (
                  <EtatVide
                    icone={CalendarClock}
                    titre="Aucun paiement en attente"
                    description="Tous les loyers connus sont réglés."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Locataire</th>
                          <th>Appartement</th>
                          <th>Échéance</th>
                          <th>Reste à payer</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donnees.prochainsPaiements.map((loyer) => (
                          <tr key={loyer.id}>
                            <td className="font-medium">{loyer.locataire.nom}</td>
                            <td>{loyer.locataire.appartement?.numero ?? '—'}</td>
                            <td className="whitespace-nowrap">{formaterDate(loyer.dateEcheance)}</td>
                            <td className="whitespace-nowrap font-medium text-error">
                              {formaterMontant(Math.max(loyer.montantDu - loyer.montantRecu, 0))}
                            </td>
                            <td>
                              <BadgeStatutLoyer statut={loyer.statut} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <section className="card border border-base-300/70 bg-base-100 shadow-sm">
              <div className="card-body p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">Derniers encaissements</h2>
                  <Link to="/Loyers" className="btn btn-ghost btn-xs text-primary">
                    Tout voir
                  </Link>
                </div>

                {donnees.derniersPaiements.length === 0 ? (
                  <EtatVide
                    icone={Wallet}
                    titre="Aucun encaissement"
                    description="Les paiements reçus apparaîtront ici."
                  />
                ) : (
                  <ul className="divide-y divide-base-300/60">
                    {donnees.derniersPaiements.map((paiement) => (
                      <li
                        key={paiement.id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{paiement.locataire.nom}</p>
                          <p className="text-xs text-base-content/50">
                            {formaterDate(paiement.datePaiement)}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-sm font-semibold text-success">
                          +{formaterMontant(paiement.montantRecu)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  to="/Locataires"
                  className="btn btn-outline btn-sm mt-3 w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Users size={15} />
                    Gérer les locataires
                  </span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
