import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:rmobile/core/themes/app_colors.dart';
import 'package:rmobile/core/themes/statut_couleurs.dart';
import 'package:rmobile/core/utils/format.dart';
import 'package:rmobile/core/widgets/pastille_statut.dart';
import 'package:rmobile/features/accueil/model/loyer_model.dart';
import 'package:rmobile/features/paiement/viewmodel/declaration_paiement_viewmodel.dart';

/// Ouvre la feuille de déclaration d'un paiement.
/// Renvoie `true` lorsque le versement a bien été enregistré.
Future<bool?> afficherDeclarationPaiement(
  BuildContext context,
  LoyerModel loyer,
) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => DeclarationPaiementSheet(loyer: loyer),
  );
}

class DeclarationPaiementSheet extends StatefulWidget {
  final LoyerModel loyer;

  const DeclarationPaiementSheet({super.key, required this.loyer});

  @override
  State<DeclarationPaiementSheet> createState() =>
      _DeclarationPaiementSheetState();
}

class _DeclarationPaiementSheetState extends State<DeclarationPaiementSheet> {
  late final DeclarationPaiementViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = DeclarationPaiementViewModel(loyer: widget.loyer);
  }

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  Future<void> _enregistrer() async {
    FocusScope.of(context).unfocus();
    final succes = await _viewModel.enregistrer();
    if (succes && mounted) {
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _viewModel,
      builder: (context, child) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Container(
            decoration: const BoxDecoration(
              color: AppColors.blanc,
              borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
            ),
            child: SafeArea(
              top: false,
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(22, 12, 22, 22),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Center(
                      child: Container(
                        width: 42,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Déclarer un paiement',
                                style: TextStyle(
                                  color: AppColors.bleuprofond,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _viewModel.loyer.moisLisible,
                                style: TextStyle(
                                  color: Colors.grey.shade600,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        PastilleStatut(
                          libelle: libelleStatutLoyer(_viewModel.loyer.statut),
                          couleur: couleurStatutLoyer(_viewModel.loyer.statut),
                        ),
                        IconButton(
                          onPressed: _viewModel.isLoading
                              ? null
                              : () => Navigator.of(context).pop(false),
                          icon: Icon(
                            Icons.close_rounded,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F6FB),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          _MontantResume(
                            libelle: 'Loyer du',
                            montant: _viewModel.loyer.montantDu,
                          ),
                          _separateur(),
                          _MontantResume(
                            libelle: 'Déjà reçu',
                            montant: _viewModel.loyer.montantRecu,
                          ),
                          _separateur(),
                          _MontantResume(
                            libelle: 'Reste',
                            montant: _viewModel.loyer.reste,
                            enAvant: true,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Montant versé',
                      style: TextStyle(
                        color: AppColors.bleuprofond,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _viewModel.montantController,
                      keyboardType: TextInputType.number,
                      onChanged: (_) => _viewModel.clearError(),
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(9),
                      ],
                      style: const TextStyle(
                        color: AppColors.bleuprofond,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                      decoration: InputDecoration(
                        suffixText: 'FCFA',
                        suffixStyle: TextStyle(
                          color: Colors.grey.shade500,
                          fontWeight: FontWeight.w600,
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF9FAFB),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 16,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                            color: AppColors.bleuBouton,
                            width: 1.6,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Moyen de paiement',
                      style: TextStyle(
                        color: AppColors.bleuprofond,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: DeclarationPaiementViewModel.modes.map((mode) {
                        final selectionne = _viewModel.modePaiement == mode;
                        return ChoiceChip(
                          label: Text(libelleModePaiement(mode)),
                          selected: selectionne,
                          onSelected: _viewModel.isLoading
                              ? null
                              : (_) => _viewModel.changerMode(mode),
                          selectedColor: const Color(0xFFEDF1FC),
                          backgroundColor: const Color(0xFFF9FAFB),
                          checkmarkColor: AppColors.bleuBouton,
                          side: BorderSide(
                            color: selectionne
                                ? AppColors.bleuBouton
                                : Colors.grey.shade300,
                          ),
                          labelStyle: TextStyle(
                            color: selectionne
                                ? AppColors.bleuBouton
                                : Colors.grey.shade700,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 18),
                    TextField(
                      controller: _viewModel.noteController,
                      maxLines: 2,
                      maxLength: 160,
                      onChanged: (_) => _viewModel.clearError(),
                      decoration: InputDecoration(
                        hintText:
                            'Référence du transfert, remarque (facultatif)',
                        hintStyle: TextStyle(
                          color: Colors.grey.shade400,
                          fontSize: 13,
                        ),
                        counterText: '',
                        filled: true,
                        fillColor: const Color(0xFFF9FAFB),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                            color: AppColors.bleuBouton,
                            width: 1.6,
                          ),
                        ),
                      ),
                    ),
                    if (_viewModel.errorMessage != null) ...[
                      const SizedBox(height: 10),
                      Text(
                        _viewModel.errorMessage!,
                        style: TextStyle(
                          color: Colors.red.shade600,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.bleuBouton,
                          foregroundColor: AppColors.blanc,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        onPressed: _viewModel.isLoading ? null : _enregistrer,
                        child: _viewModel.isLoading
                            ? const SizedBox(
                                height: 22,
                                width: 22,
                                child: CircularProgressIndicator(
                                  color: AppColors.blanc,
                                  strokeWidth: 2.5,
                                ),
                              )
                            : const Text(
                                'Enregistrer mon paiement',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "Votre bailleur est notifié dès l'enregistrement du versement.",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 11.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _separateur() {
    return Container(width: 1, height: 34, color: Colors.grey.shade300);
  }
}

class _MontantResume extends StatelessWidget {
  final String libelle;
  final int montant;
  final bool enAvant;

  const _MontantResume({
    required this.libelle,
    required this.montant,
    this.enAvant = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            libelle,
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              formaterMontant(montant).replaceAll(' FCFA', ''),
              style: TextStyle(
                color: enAvant ? AppColors.bleuBouton : AppColors.bleuprofond,
                fontSize: 15,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          Text(
            'FCFA',
            style: TextStyle(
              color: Colors.grey.shade500,
              fontSize: 9,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
