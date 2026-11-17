import 'package:flutter/material.dart';
import 'package:rmobile/core/themes/app_colors.dart';
import 'package:rmobile/core/themes/statut_couleurs.dart';
import 'package:rmobile/core/utils/format.dart';
import 'package:rmobile/core/widgets/etat_erreur.dart';
import 'package:rmobile/core/widgets/etat_vide.dart';
import 'package:rmobile/core/widgets/pastille_statut.dart';
import 'package:rmobile/features/accueil/model/loyer_model.dart';
import 'package:rmobile/features/auth/view/login_screen.dart';
import 'package:rmobile/features/historique/model/paiement_model.dart';
import 'package:rmobile/features/historique/viewmodel/historique_viewmodel.dart';
import 'package:rmobile/features/paiement/view/declaration_paiement_sheet.dart';

class HistoriqueScreen extends StatefulWidget {
  const HistoriqueScreen({super.key});

  @override
  State<HistoriqueScreen> createState() => _HistoriqueScreenState();
}

class _HistoriqueScreenState extends State<HistoriqueScreen> {
  final HistoriqueViewModel _viewModel = HistoriqueViewModel();

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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Historique',
                        style: TextStyle(
                          color: AppColors.bleuprofond,
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Retrouvez vos loyers et vos versements.',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: _selecteurOnglets(),
                ),
                const SizedBox(height: 6),
                Expanded(child: _contenu()),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _selecteurOnglets() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F2F6),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(children: [_onglet('Loyers', 0), _onglet('Paiements', 1)]),
    );
  }

  Widget _onglet(String libelle, int index) {
    final selectionne = _viewModel.onglet == index;

    return Expanded(
      child: GestureDetector(
        onTap: () => _viewModel.changerOnglet(index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selectionne ? AppColors.blanc : Colors.transparent,
            borderRadius: BorderRadius.circular(11),
            boxShadow: selectionne
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Text(
            libelle,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selectionne ? AppColors.bleuprofond : Colors.grey.shade600,
              fontSize: 13.5,
              fontWeight: selectionne ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  Widget _contenu() {
    if (_viewModel.isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.bleuBouton),
      );
    }

    if (_viewModel.errorMessage != null &&
        _viewModel.paiements.isEmpty &&
        _viewModel.loyers.isEmpty) {
      return ListView(
        padding: const EdgeInsets.all(20),
        children: [
          EtatErreur(
            message: _viewModel.errorMessage!,
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

    return RefreshIndicator(
      color: AppColors.bleuBouton,
      onRefresh: () => _viewModel.charger(silencieux: true),
      child: _viewModel.onglet == 0 ? _listeLoyers() : _listePaiements(),
    );
  }

  Widget _listeLoyers() {
    if (_viewModel.loyers.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        children: const [
          EtatVide(
            icone: Icons.event_note_outlined,
            titre: 'Aucun loyer enregistré',
            description:
                'Les avis de loyer de votre bailleur apparaîtront ici.',
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      itemCount: _viewModel.loyers.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final loyer = _viewModel.loyers[index];
        return _carteLoyer(loyer);
      },
    );
  }

  Widget _carteLoyer(LoyerModel loyer) {
    final couleur = couleurStatutLoyer(loyer.statut);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.blanc,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  loyer.moisLisible,
                  style: const TextStyle(
                    color: AppColors.bleuprofond,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              PastilleStatut(
                libelle: libelleStatutLoyer(loyer.statut),
                couleur: couleur,
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _montant('Loyer', loyer.montantDu),
              _montant('Versé', loyer.montantRecu),
              _montant('Reste', loyer.reste, enAvant: loyer.reste > 0),
            ],
          ),
          const SizedBox(height: 12),
          BarreProgression(
            valeur: loyer.progression,
            couleur: couleur,
            fond: const Color(0xFFEDF1F5),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.event_outlined, size: 15, color: Colors.grey.shade500),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Échéance : ${formaterDate(loyer.dateEcheance)}',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
              ),
              if (loyer.reste > 0)
                TextButton(
                  onPressed: () => _declarerPaiement(loyer),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.bleuBouton,
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    minimumSize: const Size(0, 32),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
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

  Widget _montant(String libelle, int montant, {bool enAvant = false}) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            libelle,
            style: TextStyle(
              color: Colors.grey.shade500,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 3),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              formaterMontant(montant),
              style: TextStyle(
                color: enAvant ? AppColors.bleuBouton : AppColors.bleuprofond,
                fontSize: 13.5,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _listePaiements() {
    if (_viewModel.paiements.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        children: const [
          EtatVide(
            icone: Icons.receipt_long_outlined,
            titre: 'Aucun versement enregistré',
            description: 'Chaque paiement déclaré ou encaissé sera listé ici.',
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      itemCount: _viewModel.paiements.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final paiement = _viewModel.paiements[index];
        return _cartePaiement(paiement);
      },
    );
  }

  Widget _cartePaiement(PaiementModel paiement) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.blanc,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFE9F8EF),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: const Icon(
                  Icons.south_west_rounded,
                  color: Color(0xFF16A34A),
                  size: 20,
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
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${formaterDate(paiement.datePaiement)} · ${libelleModePaiement(paiement.modePaiement)}',
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 11.5,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                formaterMontant(paiement.montant),
                style: const TextStyle(
                  color: Color(0xFF16A34A),
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          if ((paiement.mois ?? '').isNotEmpty ||
              (paiement.note ?? '').isNotEmpty) ...[
            const SizedBox(height: 12),
            Divider(height: 1, color: Colors.grey.shade100),
            const SizedBox(height: 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if ((paiement.mois ?? '').isNotEmpty) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDF1FC),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      formaterMois(paiement.mois!),
                      style: const TextStyle(
                        color: AppColors.bleuBouton,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                ],
                if ((paiement.note ?? '').isNotEmpty)
                  Expanded(
                    child: Text(
                      paiement.note!,
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
