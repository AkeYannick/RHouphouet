import { Building2, Pencil, Plus, Search, Trash2, Users, Wallet } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { BandeauErreur, BandeauSucces } from '../components/ui/BandeauErreur';
import { CarteStatistique } from '../components/ui/CarteStatistique';
import { Champ } from '../components/ui/Champ';
import { Chargement } from '../components/ui/Chargement';
import { EnTetePage } from '../components/ui/EnTetePage';
import { EtatVide } from '../components/ui/EtatVide';
import { Modale } from '../components/ui/Modale';
import { useMessageFlash } from '../hooks/useMessageFlash';
import { api } from '../services/api';
import type { Appartement, DonneesLocataire, Locataire } from '../types';
import { dateDuJour, formaterDate, formaterMontant, initiales } from '../utils/format';

interface FormulaireLocataire {
  nom: string;
  telephone: string;
  email: string;
  appartementId: string;
  loyerMensuel: string;
  caution: string;
  dateEntree: string;
}

function formulaireVide(): FormulaireLocataire {
  return {
    nom: '',
    telephone: '',
    email: '',
    appartementId: '',
    loyerMensuel: '',
    caution: '',
    dateEntree: dateDuJour(),
  };
}

const Locataires = () => {
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [appartements, setAppartements] = useState<Appartement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [locataireEnEdition, setLocataireEnEdition] = useState<Locataire | null>(null);
  const [formulaire, setFormulaire] = useState<FormulaireLocataire>(formulaireVide);
  const [erreurFormulaire, setErreurFormulaire] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const { message, afficherMessage } = useMessageFlash();

  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) {
      setChargement(true);
    }

    try {
      const [listeLocataires, listeAppartements] = await Promise.all([
        api.locataires.lister(),
        api.appartements.lister(),
      ]);
      setLocataires(listeLocataires);
      setAppartements(listeAppartements);
      setErreur(null);
    } catch (probleme) {
      setErreur((probleme as Error).message);
    } finally {
      if (!silencieux) {
        setChargement(false);
      }
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const ouvrirCreation = () => {
    setLocataireEnEdition(null);
    setFormulaire(formulaireVide());
    setErreurFormulaire(null);
    setModaleOuverte(true);
  };

  const ouvrirEdition = (locataire: Locataire) => {
    setLocataireEnEdition(locataire);
    setFormulaire({
      nom: locataire.nom,
      telephone: locataire.telephone,
      email: locataire.email ?? '',
      appartementId: locataire.appartementId ?? '',
      loyerMensuel: String(locataire.loyerMensuel),
      caution: String(locataire.caution),
      dateEntree: locataire.dateEntree.slice(0, 10),
    });
    setErreurFormulaire(null);
    setModaleOuverte(true);
  };

  const choisirAppartement = (appartementId: string) => {
    const appartement = appartements.find((element) => element.id === appartementId);
    setFormulaire((precedent) => ({
      ...precedent,
      appartementId,
      loyerMensuel:
        precedent.loyerMensuel || String(appartement?.loyerMensuel ?? ''),
    }));
  };

  const enregistrer = async (evenement: FormEvent) => {
    evenement.preventDefault();

    if (!formulaire.nom.trim()) {
      setErreurFormulaire('Le nom complet est obligatoire');
      return;
    }

    if (!formulaire.telephone.trim()) {
      setErreurFormulaire('Le numéro de téléphone est obligatoire');
      return;
    }

    if (!formulaire.dateEntree) {
      setErreurFormulaire("La date d'entrée est obligatoire");
      return;
    }

    const donnees: DonneesLocataire = {
      nom: formulaire.nom.trim(),
      telephone: formulaire.telephone.trim(),
      email: formulaire.email.trim() || undefined,
      appartementId: formulaire.appartementId || undefined,
      loyerMensuel: formulaire.loyerMensuel ? Number(formulaire.loyerMensuel) : undefined,
      caution: formulaire.caution ? Number(formulaire.caution) : 0,
      dateEntree: formulaire.dateEntree,
    };

    setEnregistrement(true);

    try {
      if (locataireEnEdition) {
        await api.locataires.modifier(locataireEnEdition.id, donnees);
        afficherMessage('Locataire modifié avec succès');
      } else {
        await api.locataires.creer(donnees);
        afficherMessage('Locataire ajouté avec succès');
      }

      setModaleOuverte(false);
      await charger(true);
    } catch (probleme) {
      setErreurFormulaire((probleme as Error).message);
    } finally {
      setEnregistrement(false);
    }
  };

  const retirer = async (locataire: Locataire) => {
    if (
      !window.confirm(
        `Retirer ${locataire.nom} de la gestion locative ? Son historique financier sera conservé.`,
      )
    ) {
      return;
    }

    try {
      await api.locataires.supprimer(locataire.id);
      afficherMessage('Locataire retiré');
      await charger(true);
    } catch (probleme) {
      setErreur((probleme as Error).message);
    }
  };

  const locatairesFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();

    if (!terme) {
      return locataires;
    }

    return locataires.filter((locataire) =>
      [locataire.nom, locataire.telephone, locataire.appartement?.numero ?? '']
        .join(' ')
        .toLowerCase()
        .includes(terme),
    );
  }, [locataires, recherche]);

  const totalLoyers = locataires.reduce((total, locataire) => total + locataire.loyerMensuel, 0);
  const totalCautions = locataires.reduce((total, locataire) => total + locataire.caution, 0);

  return (
    <div className="space-y-5">
      <EnTetePage
        titre="Locataires"
        description="Gérez les baux, les coordonnées et les appartements occupés."
        actions={
          <button type="button" onClick={ouvrirCreation} className="btn btn-primary btn-sm gap-2">
            <Plus size={16} />
            Ajouter un locataire
          </button>
        }
      />

      {message && <BandeauSucces message={message} />}
      {erreur && <BandeauErreur message={erreur} onReessayer={() => void charger()} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <CarteStatistique
          libelle="Locataires actifs"
          valeur={String(locataires.length)}
          detail={`${appartements.filter((appartement) => appartement.locataires?.length).length} appartement(s) occupé(s)`}
          icone={Users}
        />
        <CarteStatistique
          libelle="Loyers mensuels"
          valeur={formaterMontant(totalLoyers)}
          detail="Somme des loyers des locataires actifs"
          icone={Wallet}
          ton="succes"
        />
        <CarteStatistique
          libelle="Cautions détenues"
          valeur={formaterMontant(totalCautions)}
          detail="Montant total des garanties"
          icone={Building2}
          ton="neutre"
        />
      </div>

      <section className="card border border-base-300/70 bg-base-100 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-base-300/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-base font-semibold">Liste des locataires</h2>
            <p className="text-xs text-base-content/50">
              {locatairesFiltres.length} résultat(s) sur {locataires.length}
            </p>
          </div>

          <label className="input input-bordered flex w-full items-center gap-2 sm:max-w-xs">
            <Search size={16} className="text-base-content/40" />
            <input
              type="search"
              className="grow"
              placeholder="Nom, téléphone, appartement…"
              value={recherche}
              onChange={(evenement) => setRecherche(evenement.target.value)}
            />
          </label>
        </div>

        {chargement ? (
          <div className="p-6">
            <Chargement texte="Chargement des locataires…" />
          </div>
        ) : locatairesFiltres.length === 0 ? (
          <EtatVide
            icone={Users}
            titre={locataires.length === 0 ? 'Aucun locataire enregistré' : 'Aucun résultat'}
            description={
              locataires.length === 0
                ? 'Ajoutez un locataire et rattachez-le à un appartement.'
                : 'Modifiez votre recherche pour trouver un locataire.'
            }
            action={
              locataires.length === 0 ? (
                <button type="button" onClick={ouvrirCreation} className="btn btn-primary btn-sm">
                  Ajouter un locataire
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Vue tableau sur écran moyen et grand */}
            <div className="hidden overflow-x-auto md:block">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Locataire</th>
                    <th>Téléphone</th>
                    <th>Appartement</th>
                    <th>Depuis</th>
                    <th>Loyer mensuel</th>
                    <th>Caution</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locatairesFiltres.map((locataire) => (
                    <tr key={locataire.id} className="hover">
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {initiales(locataire.nom)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{locataire.nom}</p>
                            <p className="truncate text-xs text-base-content/50">
                              {locataire.email ?? 'Pas d’e-mail'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">{locataire.telephone}</td>
                      <td>{locataire.appartement?.numero ?? '—'}</td>
                      <td className="whitespace-nowrap">{formaterDate(locataire.dateEntree)}</td>
                      <td className="whitespace-nowrap font-medium">
                        {formaterMontant(locataire.loyerMensuel)}
                      </td>
                      <td className="whitespace-nowrap">{formaterMontant(locataire.caution)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => ouvrirEdition(locataire)}
                            className="btn btn-ghost btn-sm btn-square"
                            aria-label={`Modifier ${locataire.nom}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void retirer(locataire)}
                            className="btn btn-ghost btn-sm btn-square text-error"
                            aria-label={`Retirer ${locataire.nom}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vue cartes sur mobile */}
            <div className="grid gap-3 p-4 md:hidden">
              {locatairesFiltres.map((locataire) => (
                <article
                  key={locataire.id}
                  className="rounded-xl border border-base-300/70 bg-base-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {initiales(locataire.nom)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{locataire.nom}</p>
                        <p className="truncate text-xs text-base-content/55">
                          {locataire.telephone}
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-primary badge-sm border-0">
                      {locataire.appartement?.numero ?? 'Sans logement'}
                    </span>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-base-content/45">Loyer</dt>
                      <dd className="font-medium">{formaterMontant(locataire.loyerMensuel)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-base-content/45">Caution</dt>
                      <dd className="font-medium">{formaterMontant(locataire.caution)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-base-content/45">Depuis</dt>
                      <dd>{formaterDate(locataire.dateEntree)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-base-content/45">E-mail</dt>
                      <dd className="truncate">{locataire.email ?? '—'}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex justify-end gap-1 border-t border-base-300/60 pt-2">
                    <button
                      type="button"
                      onClick={() => ouvrirEdition(locataire)}
                      className="btn btn-ghost btn-sm gap-1"
                    >
                      <Pencil size={14} />
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => void retirer(locataire)}
                      className="btn btn-ghost btn-sm gap-1 text-error"
                    >
                      <Trash2 size={14} />
                      Retirer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <Modale
        ouvert={modaleOuverte}
        titre={locataireEnEdition ? 'Modifier un locataire' : 'Ajouter un locataire'}
        description="Le loyer est repris automatiquement de l'appartement si vous le laissez vide."
        onFermer={() => setModaleOuverte(false)}
        taille="lg"
        pied={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setModaleOuverte(false)}
            >
              Annuler
            </button>
            <button
              type="submit"
              form="formulaire-locataire"
              className="btn btn-primary"
              disabled={enregistrement}
            >
              {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <form
          id="formulaire-locataire"
          onSubmit={(evenement) => void enregistrer(evenement)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Champ libelle="Nom complet">
            <input
              className="input input-bordered w-full"
              value={formulaire.nom}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, nom: evenement.target.value })
              }
              placeholder="Prénom & Nom"
              required
            />
          </Champ>

          <Champ libelle="Téléphone">
            <input
              type="tel"
              className="input input-bordered w-full"
              value={formulaire.telephone}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, telephone: evenement.target.value })
              }
              placeholder="+225 07 00 00 00 00"
              required
            />
          </Champ>

          <Champ libelle="Adresse e-mail (facultatif)">
            <input
              type="email"
              className="input input-bordered w-full"
              value={formulaire.email}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, email: evenement.target.value })
              }
              placeholder="locataire@exemple.com"
            />
          </Champ>

          <Champ libelle="Appartement">
            <select
              className="select select-bordered w-full"
              value={formulaire.appartementId}
              onChange={(evenement) => choisirAppartement(evenement.target.value)}
            >
              <option value="">Sans appartement</option>
              {appartements.map((appartement) => {
                const occupant = locataires.find(
                  (locataire) =>
                    locataire.appartementId === appartement.id &&
                    locataire.id !== locataireEnEdition?.id,
                );

                return (
                  <option key={appartement.id} value={appartement.id} disabled={Boolean(occupant)}>
                    {appartement.numero}
                    {occupant ? ` — occupé (${occupant.nom})` : ' — libre'} ·{' '}
                    {formaterMontant(appartement.loyerMensuel)}
                  </option>
                );
              })}
            </select>
          </Champ>

          <Champ libelle="Loyer mensuel (FCFA)">
            <input
              type="number"
              min={0}
              className="input input-bordered w-full"
              value={formulaire.loyerMensuel}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, loyerMensuel: evenement.target.value })
              }
              placeholder="Ex. 150000"
            />
          </Champ>

          <Champ libelle="Caution (FCFA)">
            <input
              type="number"
              min={0}
              className="input input-bordered w-full"
              value={formulaire.caution}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, caution: evenement.target.value })
              }
              placeholder="Ex. 300000"
            />
          </Champ>

          <Champ libelle="Date d'entrée">
            <input
              type="date"
              className="input input-bordered w-full"
              value={formulaire.dateEntree}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, dateEntree: evenement.target.value })
              }
              required
            />
          </Champ>

          {erreurFormulaire && (
            <p className="text-sm text-error sm:col-span-2">{erreurFormulaire}</p>
          )}
        </form>
      </Modale>
    </div>
  );
};

export default Locataires;
