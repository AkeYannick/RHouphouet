import 'dart:io';

import 'package:flutter/material.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import 'package:rmobile/core/network/api_client.dart';
import 'package:rmobile/core/themes/app_colors.dart';
import 'package:rmobile/core/themes/statut_couleurs.dart';
import 'package:rmobile/core/utils/format.dart';
import 'package:rmobile/core/widgets/etat_erreur.dart';
import 'package:rmobile/core/widgets/etat_vide.dart';
import 'package:rmobile/core/widgets/pastille_statut.dart';
import 'package:rmobile/features/auth/view/login_screen.dart';
import 'package:rmobile/features/contrat/model/contrat_model.dart';
import 'package:rmobile/features/contrat/viewmodel/contrat_viewmodel.dart';

class ContratScreen extends StatefulWidget {
  const ContratScreen({super.key});

  @override
  State<ContratScreen> createState() => _ContratScreenState();
}

class _ContratScreenState extends State<ContratScreen> {
  final ContratViewModel _viewModel = ContratViewModel();

  bool _telechargement = false;

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  Future<void> _telechargerContrat() async {
    final contrat = _viewModel.contrat;

    if (contrat == null || _telechargement) {
      return;
    }

    setState(() => _telechargement = true);

    try {
      final octets = await _viewModel.telechargerPdf();
      final dossier = await getTemporaryDirectory();
      final fichier = File('${dossier.path}/contrat-${contrat.numero}.pdf');
      await fichier.writeAsBytes(octets, flush: true);

      final resultat = await OpenFilex.open(fichier.path);

      if (resultat.type != ResultType.done && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Contrat enregistré : ${fichier.path}', maxLines: 3),
          ),
        );
      }
    } on ApiException catch (erreur) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(erreur.message)),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Impossible de télécharger le contrat. Réessayez.'),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _telechargement = false);
      }
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
                        'Mon contrat',
                        style: TextStyle(
                          color: AppColors.bleuprofond,
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Les conditions de votre location en cours.',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(child: _contenu()),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _contenu() {
    if (_viewModel.isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.bleuBouton),
      );
    }

    if (_viewModel.errorMessage != null) {
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

    final contrat = _viewModel.contrat;

    if (contrat == null) {
      return ListView(
        padding: const EdgeInsets.all(20),
        children: const [
          EtatVide(
            icone: Icons.description_outlined,
            titre: 'Aucun contrat actif',
            description: 'Votre bailleur enregistrera votre contrat depuis son espace. Il apparaîtra ici automatiquement.',
          ),
        ],
      );
    }

    return RefreshIndicator(
      color: AppColors.bleuBouton,
      onRefresh: _viewModel.charger,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        children: [
          _enteteContrat(contrat),
          const SizedBox(height: 16),
          _carteDocument(contrat),
          const SizedBox(height: 16),
          _carteConditions(contrat),
          const SizedBox(height: 16),
          _carteMontants(contrat),
          if ((contrat.clauses ?? '').trim().isNotEmpty) ...[
            const SizedBox(height: 16),
            _carteClauses(contrat.clauses!),
          ],
        ],
      ),
    );
  }

  Widget _enteteContrat(ContratModel contrat) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0B3A5C), AppColors.bleuprofond],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.blanc.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.description_outlined,
                  color: AppColors.blanc,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Contrat ${contrat.numero}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.blanc,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      contrat.appartement?.libelle ?? 'Logement non renseigné',
                      style: TextStyle(
                        color: AppColors.blanc.withValues(alpha: 0.7),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              PastilleStatut(
                libelle: libelleStatutContrat(contrat.statut),
                couleur: couleurStatutContrat(contrat.statut),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _dateContrat(
                  libelle: 'Début du bail',
                  valeur: formaterDate(contrat.dateDebut),
                ),
              ),
              Container(
                width: 1,
                height: 34,
                color: AppColors.blanc.withValues(alpha: 0.15),
              ),
              Expanded(
                child: _dateContrat(
                  libelle: 'Fin du bail',
                  valeur: contrat.dateFin != null
                      ? formaterDate(contrat.dateFin)
                      : 'Durée indéterminée',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _dateContrat({required String libelle, required String valeur}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          libelle,
          style: TextStyle(
            color: AppColors.blanc.withValues(alpha: 0.6),
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          valeur,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: AppColors.blanc,
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  Widget _carteDocument(ContratModel contrat) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.blanc,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFEDF1FC),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.picture_as_pdf_outlined,
              color: AppColors.bleuBouton,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Contrat de location',
                  style: TextStyle(
                    color: AppColors.bleuprofond,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'PDF · ${contrat.numero} · ${libelleStatutContrat(contrat.statut)}',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: AppColors.bleuBouton,
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: _telechargement ? null : _telechargerContrat,
              child: SizedBox(
                width: 44,
                height: 44,
                child: _telechargement
                    ? const Padding(
                        padding: EdgeInsets.all(12),
                        child: CircularProgressIndicator(
                          strokeWidth: 2.2,
                          color: AppColors.blanc,
                        ),
                      )
                    : const Icon(
                        Icons.download_rounded,
                        color: AppColors.blanc,
                        size: 22,
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _carteConditions(ContratModel contrat) {
    return _carte(
      titre: 'Détails du bail',
      children: [
        _ligne('Locataire', contrat.nomLocataire ?? '—'),
        _ligne('Appartement', contrat.appartement?.numero ?? '—'),
        _ligne('Loyer mensuel', formaterMontant(contrat.loyerMensuel)),
        _ligne(
          'Charges mensuelles',
          formaterMontant(contrat.chargesMensuelles),
        ),
      ],
    );
  }

  Widget _carteMontants(ContratModel contrat) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFEDF1FC),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Total mensuel',
                  style: TextStyle(
                    color: AppColors.bleuprofond,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                formaterMontant(contrat.totalMensuel),
                style: const TextStyle(
                  color: AppColors.bleuprofond,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Divider(height: 1, color: Colors.white.withValues(alpha: 0.8)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Caution détenue par le bailleur',
                  style: TextStyle(color: Colors.grey.shade700, fontSize: 12.5),
                ),
              ),
              Text(
                formaterMontant(contrat.caution),
                style: const TextStyle(
                  color: AppColors.bleuBouton,
                  fontSize: 13.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _carteClauses(String clauses) {
    return _carte(
      titre: 'Clauses particulières',
      children: [
        Text(
          clauses,
          style: TextStyle(
            color: Colors.grey.shade700,
            fontSize: 13,
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _carte({required String titre, required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.blanc,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            titre,
            style: const TextStyle(
              color: AppColors.bleuprofond,
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }

  Widget _ligne(String libelle, String valeur) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              libelle,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              valeur,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: AppColors.bleuprofond,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
