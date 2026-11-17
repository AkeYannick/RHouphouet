import 'package:flutter/material.dart';
import 'package:rmobile/core/data/espace_locataire_repository.dart';
import 'package:rmobile/core/network/api_client.dart';
import 'package:rmobile/core/session/session_store.dart';
import 'package:rmobile/features/messages/model/message_model.dart';

class MessagesViewModel extends ChangeNotifier {
  MessagesViewModel({EspaceLocataireRepository? repository})
    : _repository = repository ?? EspaceLocataireRepository() {
    charger();
  }

  final EspaceLocataireRepository _repository;
  final TextEditingController messageController = TextEditingController();

  List<MessageModel> _messages = const [];
  bool _isLoading = true;
  bool _envoiEnCours = false;
  String? _errorMessage;
  bool _sessionExpiree = false;

  List<MessageModel> get messages => _messages;
  bool get isLoading => _isLoading;
  bool get envoiEnCours => _envoiEnCours;
  String? get errorMessage => _errorMessage;
  bool get sessionExpiree => _sessionExpiree;

  Future<void> charger({bool silencieux = false}) async {
    if (!silencieux) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      _messages = await _repository.messages();
      _errorMessage = null;
      _sessionExpiree = false;
    } on ApiException catch (erreur) {
      _sessionExpiree = erreur.sessionExpiree;
      _errorMessage = erreur.sessionExpiree
          ? 'Votre session a expiré. Reconnectez-vous pour continuer.'
          : erreur.message;
      if (erreur.sessionExpiree) {
        await SessionStore.effacer();
      }
    } catch (_) {
      _errorMessage = 'Impossible de charger vos messages. Réessayez.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> envoyer() async {
    final contenu = messageController.text.trim();

    if (contenu.isEmpty) {
      return false;
    }

    _envoiEnCours = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final message = await _repository.envoyerMessage(contenu);
      _messages = [..._messages, message];
      messageController.clear();
      return true;
    } on ApiException catch (erreur) {
      _errorMessage = erreur.message;
      return false;
    } catch (_) {
      _errorMessage = "Le message n'a pas pu être envoyé. Réessayez.";
      return false;
    } finally {
      _envoiEnCours = false;
      notifyListeners();
    }
  }

  void clearError() {
    if (_errorMessage != null) {
      _errorMessage = null;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    messageController.dispose();
    super.dispose();
  }
}
