import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:rmobile/core/data/espace_locataire_repository.dart';
import 'package:rmobile/core/network/api_client.dart';
import 'package:rmobile/features/auth/model/user_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthViewModel extends ChangeNotifier {
  AuthViewModel({EspaceLocataireRepository? repository})
    : _repository = repository ?? EspaceLocataireRepository();

  final EspaceLocataireRepository _repository;

  final TextEditingController phoneController = TextEditingController();
  final TextEditingController otpController = TextEditingController();

  bool _isLoading = false;
  String? _errorMessage;
  String? _codeDemo;
  LocataireModel? _locataire;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Code renvoyé par le serveur prototype (aucun fournisseur SMS branché).
  String? get codeDemo => _codeDemo;

  LocataireModel? get locataire => _locataire;

  /// Numéro saisi, sans espaces ni indicatif.
  String get telephoneSaisi =>
      phoneController.text.replaceAll(RegExp(r'\D'), '');

  /// Formate le numéro sous la forme : +225 •• •• •• 27 07
  String get maskedPhoneNumber {
    final digits = telephoneSaisi;
    if (digits.length >= 4) {
      final last4 = digits.substring(digits.length - 4);
      final p1 = last4.substring(0, 2);
      final p2 = last4.substring(2, 4);
      return "+225 •• •• •• $p1 $p2";
    }
    return "+225 •• •• •• •• ••";
  }

  void clearError() {
    if (_errorMessage != null) {
      _errorMessage = null;
      notifyListeners();
    }
  }

  /// Étape 1 : vérifie le numéro auprès du serveur et demande le code.
  Future<bool> envoyerCodeOtp() async {
    clearError();
    _codeDemo = null;

    if (telephoneSaisi.length < 10) {
      _errorMessage = "Veuillez entrer un numéro valide à 10 chiffres.";
      notifyListeners();
      return false;
    }

    _isLoading = true;
    notifyListeners();

    try {
      _codeDemo = await _repository.demanderCode(telephoneSaisi);
      return true;
    } on ApiException catch (erreur) {
      _errorMessage = erreur.message;
      return false;
    } catch (_) {
      _errorMessage =
          "Ce numéro n'est associé à aucun logement. Contactez votre bailleur.";
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Étape 2 : vérifie les 6 chiffres et enregistre la session.
  Future<bool> verifierCodeOtp() async {
    clearError();
    final code = otpController.text.trim();

    if (!RegExp(r'^\d{6}$').hasMatch(code)) {
      _errorMessage = "Veuillez saisir les 6 chiffres reçus par SMS.";
      notifyListeners();
      return false;
    }

    _isLoading = true;
    notifyListeners();

    try {
      _locataire = await _repository.verifierCode(
        telephone: telephoneSaisi,
        code: code,
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('est_connecte', true);
      await prefs.setString('locataire_phone', telephoneSaisi);

      return true;
    } on ApiException catch (erreur) {
      _errorMessage = erreur.message;
      return false;
    } catch (_) {
      _errorMessage = "Code incorrect ou expiré. Veuillez réessayer.";
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void resetOtpFields() {
    otpController.clear();
    clearError();
  }

  /// Indique si l'appareil peut protéger la session par biométrie.
  Future<bool> biometrieDisponible() async {
    try {
      return await LocalAuthentication().isDeviceSupported();
    } catch (_) {
      return false;
    }
  }

  @override
  void dispose() {
    phoneController.dispose();
    otpController.dispose();
    super.dispose();
  }
}
