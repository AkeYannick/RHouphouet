import { Eye, EyeOff, Lock, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import logoRH from '../assets/logoRH.png';
import { useAuth } from '../contexts/AuthContext';
import { cheminInterne } from '../utils/securite';

const Connexion = () => {
  const { connecte, connexion } = useAuth();
  const emplacement = useLocation();
  const depuis = cheminInterne(
    (emplacement.state as { depuis?: string } | null)?.depuis,
  );
  const [dejaConnecte] = useState(connecte);

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [redirection, setRedirection] = useState<string | null>(null);

  if (redirection) {
    return <Navigate to={redirection} replace />;
  }

  if (dejaConnecte) {
    return <Navigate to="/" replace />;
  }

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);

    try {
      await connexion(email.trim(), motDePasse);
      setRedirection(depuis);
    } catch (probleme) {
      setErreur((probleme as Error).message);
      setEnvoiEnCours(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-xl lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-content lg:flex">
          <img
            src={logoRH}
            alt="R. Houphouet"
            className="h-14 w-auto self-start rounded-xl bg-indigo-800 p-2"
          />

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-content/70">
              Gestion locative
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">Résidence Houphouët</h1>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-content/80">
              Suivez vos appartements, vos loyers, vos charges et vos échanges avec les locataires
              depuis un seul espace.
            </p>
          </div>

          <p className="text-xs text-primary-content/60">
            © {new Date().getFullYear()} R. Houphouet
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8 lg:hidden">
            <img src={logoRH} alt="R. Houphouet" className="h-11 w-auto" />
          </div>

          <span className="badge badge-primary badge-sm gap-1.5">
            <ShieldCheck size={13} />
            Espace administrateur
          </span>

          <h2 className="mt-4 text-2xl font-semibold text-base-content">Connexion</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Saisissez vos identifiants pour accéder au tableau de bord.
          </p>

          <form className="mt-7 space-y-4" onSubmit={soumettre}>
            <div>
              <label
                htmlFor="connexion-email"
                className="mb-1.5 block text-sm font-medium text-base-content/80"
              >
                Adresse e-mail
              </label>
              <div className="input input-bordered flex w-full items-center gap-2">
                <Mail size={17} className="shrink-0 text-base-content/40" />
                <input
                  id="connexion-email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="vous@exemple.com"
                  className="grow bg-transparent text-sm outline-none"
                  value={email}
                  onChange={(evenement) => setEmail(evenement.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="connexion-mot-de-passe"
                className="mb-1.5 block text-sm font-medium text-base-content/80"
              >
                Mot de passe
              </label>
              <div className="input input-bordered flex w-full items-center gap-2">
                <Lock size={17} className="shrink-0 text-base-content/40" />
                <input
                  id="connexion-mot-de-passe"
                  type={motDePasseVisible ? 'text' : 'password'}
                  name="motDePasse"
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  className="grow bg-transparent text-sm outline-none"
                  value={motDePasse}
                  onChange={(evenement) => setMotDePasse(evenement.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMotDePasseVisible((visible) => !visible)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base-content/50 transition hover:bg-base-200 hover:text-base-content"
                  aria-label={
                    motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                  }
                >
                  {motDePasseVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {erreur && (
              <div role="alert" className="rounded-xl bg-error/10 px-3 py-2.5 text-sm text-error">
                {erreur}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full gap-2"
              disabled={envoiEnCours}
            >
              {envoiEnCours ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Connexion…
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Se connecter
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-base-content/45">
            Accès réservé à l’administration de la résidence.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Connexion;
