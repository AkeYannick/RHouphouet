import 'package:flutter/material.dart';
import 'package:rmobile/core/themes/app_colors.dart';
import 'package:rmobile/core/themes/statut_couleurs.dart';
import 'package:rmobile/core/utils/format.dart';
import 'package:rmobile/core/widgets/etat_erreur.dart';
import 'package:rmobile/core/widgets/etat_vide.dart';
import 'package:rmobile/core/widgets/pastille_statut.dart';
import 'package:rmobile/features/accueil/model/loyer_model.dart';
import 'package:rmobile/features/accueil/viewmodel/accueil_viewmodel.dart';
import 'package:rmobile/features/auth/view/login_screen.dart';
import 'package:rmobile/features/historique/model/paiement_model.dart';
import 'package:rmobile/features/paiement/view/declaration_paiement_sheet.dart';

class AccueilScreen extends StatefulWidget {
  const AccueilScreen({super.key});

  @override
  State<AccueilScreen> createState() => _AccueilScreenState();
}

class _AccueilScreenState extends State<AccueilScreen> {
  final AccueilViewModel _viewModel = AccueilViewModel();

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  Future<void> _declarerPaiement(LoyerModel loyer) async {
    final succes = await afficherDeclarationPaiement(context, loyer);
    if (succes == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFF16A34A),
          behavior: SnackBarBehavior.floating,
          content: const Text('Votre paiement a bien été enregistré.'),
        ),
      );
    }
  }

  void _seReconnecter() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _viewModel,
      builder: (context, child) {
        return Scaffold(
          backgroundColor: const Color(0xFFFAFAFC),
          body: SafeArea(
            child: Column(
              children: [
                _entete(),
                Expanded(child: _contenu()),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _entete() {
    final locataire = _viewModel.locataire;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 6),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppColors.bleuprofond,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Image.asset('assets/Logo/logoRH.png', fit: BoxFit.contain),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Bonjour,',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                ),
                const SizedBox(height: 2),
                Text(
                  locataire != null && locataire.prenom.isNotEmpty
                      ? locataire.prenom
                      : 'Locataire',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.bleuprofond,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          InkWell(
            borderRadius: BorderRadius.circular(22),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  behavior: SnackBarBehavior.floating,
                  content: Text('Vous êtes à jour, aucune alerte.'),
                ),
              );
            },
            child: Container(
              width: 42,
              height: 42,
              decoration: const BoxDecoration(
                color: Color(0xFFF3F4F6),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.notifications_none_rounded,
                color: AppColors.bleuprofond,
                size: 22,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _contenu() {
    if (_viewModel.isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.bleuBouton),
      );
    }

    if (_viewModel.locataire == null) {
      return ListView(
        padding: const EdgeInsets.all(20),
        children: [
          EtatErreur(
            message:
                _viewModel.errorMessage ??
                'Impossible de charger votre espace.',
            onReessayer: _viewModel.charger,
            action: _viewModel.sessionExpiree
                ? ElevatedButton(
                    onPressed: _seReconnecter,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.bleuBouton,
                      foregroundColor: AppColors.blanc,
                      elevation: 0,
                    ),
                    child: const Text('Se reconnecter'),
                  )
                : null,
          ),
        ],
      );
    }

    final locataire = _viewModel.locataire!;
    final loyer = _viewModel.loyerCourant;

    return RefreshIndicator(
      color: AppColors.bleuBouton,
      onRefresh: () => _viewModel.charger(silencieux: true),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
        children: [
          Text(
            locataire.logement,
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 16),
          if (loyer != null)
            _carteLoyerCourant(loyer)
          else
            const EtatVide(
              icone: Icons.receipt_long_outlined,
              titre: 'Aucun loyer enregistré',
              description:
                  'Votre bailleur préparera votre prochain avis de loyer.',
            ),
          const SizedBox(height: 22),
          const _TitreSection(titre: 'Mon logement'),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.blanc,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                _LigneInfo(
                  icone: Icons.apartment_rounded,
                  libelle: 'Logement',
                  valeur: locataire.appartement?.numero ?? '—',
                ),
                _divider(),
                _LigneInfo(
                  icone: Icons.payments_outlined,
                  libelle: 'Loyer mensuel',
                  valeur: formaterMontant(locataire.loyerMensuel),
                ),
                _divider(),
                _LigneInfo(
                  icone: Icons.savings_outlined,
                  libelle: 'Caution',
                  valeur: formaterMontant(locataire.caution),
                ),
                _divider(),
                _LigneInfo(
                  icone: Icons.event_available_outlined,
                  libelle: 'Entrée dans les lieux',
                  valeur: formaterDate(locataire.dateEntree),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          const _TitreSection(titre: 'Derniers paiements'),
          const SizedBox(height: 10),
          if (_viewModel.derniersPaiements.isEmpty)
            const EtatVide(
              icone: Icons.history_rounded,
              titre: 'Aucun paiement pour le moment',
              description: 'Vos versements apparaîtront ici.',
            )
          else
            Container(
              decoration: BoxDecoration(
                color: AppColors.blanc,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  for (
                    var i = 0;
                    i < _viewModel.derniersPaiements.length;
                    i++
                  ) ...[
                    if (i > 0) _divider(indent: 60),
                    _lignePaiement(_viewModel.derniersPaiements[i]),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _carteLoyerCourant(LoyerModel loyer) {
    final statutCouleur = couleurStatutLoyer(loyer.statut);
    final solde = loyer.estSolde;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0B3A5C), AppColors.bleuprofond],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: AppColors.bleuprofond.withValues(alpha: 0.22),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Loyer de ${loyer.moisLisible}',
                  style: const TextStyle(
                    color: AppColors.blanc,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              PastilleStatut(
                libelle: libelleStatutLoyer(loyer.statut),
                couleur: solde ? const Color(0xFF4ADE80) : statutCouleur,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            solde ? 'Loyer réglé' : 'Reste à payer',
            style: TextStyle(
              color: AppColors.blanc.withValues(alpha: 0.7),
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            formaterMontant(loyer.reste),
            style: const TextStyle(
              color: AppColors.blanc,
              fontSize: 30,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'sur ${formaterMontant(loyer.montantDu)} · échéance ${formaterDate(loyer.dateEcheance)}',
            style: TextStyle(
              color: AppColors.blanc.withValues(alpha: 0.65),
              fontSize: 11.5,
            ),
          ),
          const SizedBox(height: 16),
          BarreProgression(valeur: loyer.progression),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Déjà versé : ${formaterMontant(loyer.montantRecu)}',
                  style: TextStyle(
                    color: AppColors.blanc.withValues(alpha: 0.8),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (!solde)
                ElevatedButton(
                  onPressed: () => _declarerPaiement(loyer),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blanc,
                    foregroundColor: AppColors.bleuprofond,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Déclarer un paiement',
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _lignePaiement(PaiementModel paiement) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFFEDF1FC),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.check_circle_outline_rounded,
              color: AppColors.bleuBouton,
              size: 19,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  paiement.reference,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.bleuprofond,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${formaterDate(paiement.datePaiement)} · ${libelleModePaiement(paiement.modePaiement)}',
                  style: TextStyle(color: Colors.grey.shade500, fontSize: 11.5),
                ),
              ],
            ),
          ),
          Text(
            formaterMontant(paiement.montant),
            style: const TextStyle(
              color: Color(0xFF16A34A),
              fontSize: 13,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider({double indent = 0}) {
    return Divider(
      height: 1,
      thickness: 1,
      indent: indent,
      color: Colors.grey.shade100,
    );
  }
}

class _TitreSection extends StatelessWidget {
  final String titre;

  const _TitreSection({required this.titre});

  @override
  Widget build(BuildContext context) {
    return Text(
      titre,
      style: const TextStyle(
        color: AppColors.bleuprofond,
        fontSize: 15,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

class _LigneInfo extends StatelessWidget {
  final IconData icone;
  final String libelle;
  final String valeur;

  const _LigneInfo({
    required this.icone,
    required this.libelle,
    required this.valeur,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Icon(icone, color: AppColors.bleuBouton, size: 19),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              libelle,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
            ),
          ),
          Text(
            valeur,
            textAlign: TextAlign.right,
            style: const TextStyle(
              color: AppColors.bleuprofond,
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
