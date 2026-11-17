import 'package:flutter/material.dart';
import 'package:rmobile/core/data/espace_locataire_repository.dart';
import 'package:rmobile/core/network/api_client.dart';
import 'package:rmobile/core/session/signaux_app.dart';
import 'package:rmobile/core/utils/format.dart';
import 'package:rmobile/features/accueil/model/loyer_model.dart';

/// Formulaire de déclaration d'un versement pour un loyer donné.
class DeclarationPaiementViewModel extends ChangeNotifier {
  DeclarationPaiementViewModel({
    required LoyerModel loyer,
    EspaceLocataireRepository? repository,
  }) : _loyer = loyer,
       _repository = repository ?? EspaceLocataireRepository() {
    montantController = TextEditingController(text: '${loyer.reste}');
  }

  final LoyerModel _loyer;
  final EspaceLocataireRepository _repository;

  static const List<String> modes = [
    'MOBILE_MONEY',
    'ESPECES',
    'VIREMENT',
    'CARTE',
  ];

  late final TextEditingController montantController;
  final TextEditingController noteController = TextEditingController();

  String _modePaiement = 'MOBILE_MONEY';
  bool _isLoading = false;
  String? _errorMessage;

  LoyerModel get loyer => _loyer;
  String get modePaiement => _modePaiement;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  void changerMode(String mode) {
    if (_modePaiement == mode) return;
    _modePaiement = mode;
    notifyListeners();
  }

  void clearError() {
    if (_errorMessage != null) {
      _errorMessage = null;
      notifyListeners();
    }
  }

  Future<bool> enregistrer() async {
    clearError();

    final montant = int.tryParse(
      montantController.text.replaceAll(RegExp(r'\D'), ''),
    );

    if (montant == null || montant < 1) {
      _errorMessage = 'Saisissez un montant supérieur à 0.';
      notifyListeners();
      return false;
    }

    if (montant > _loyer.reste) {
      _errorMessage =
          'Le montant dépasse le reste à payer (${formaterMontant(_loyer.reste)}).';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    notifyListeners();

    try {
      await _repository.payer(
        mois: _loyer.mois,
        montant: montant,
        modePaiement: _modePaiement,
        note: noteController.text,
      );

      SignauxApp.paiements.value++;
      return true;
    } on ApiException catch (erreur) {
      _errorMessage = erreur.message;
      return false;
    } catch (_) {
      _errorMessage = "Le paiement n'a pas pu être enregistré. Réessayez.";
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    montantController.dispose();
    noteController.dispose();
    super.dispose();
  }
}
