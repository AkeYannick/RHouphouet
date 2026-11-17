import 'package:flutter/material.dart';
import 'package:rmobile/core/themes/app_colors.dart';
import 'package:rmobile/core/utils/format.dart';
import 'package:rmobile/core/widgets/etat_erreur.dart';
import 'package:rmobile/core/widgets/etat_vide.dart';
import 'package:rmobile/features/auth/view/login_screen.dart';
import 'package:rmobile/features/messages/model/message_model.dart';
import 'package:rmobile/features/messages/viewmodel/messages_viewmodel.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final MessagesViewModel _viewModel = MessagesViewModel();

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  Future<void> _envoyer() async {
    FocusScope.of(context).unfocus();
    await _viewModel.envoyer();
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
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 14),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.bleuprofond,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(
                          Icons.support_agent_rounded,
                          color: AppColors.blanc,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Messages',
                              style: TextStyle(
                                color: AppColors.bleuprofond,
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Administration · Résidence Houphouët',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(child: _conversation()),
                if (_viewModel.errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                    child: Text(
                      _viewModel.errorMessage!,
                      style: TextStyle(
                        color: Colors.red.shade600,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                _compositeur(),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _conversation() {
    if (_viewModel.isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.bleuBouton),
      );
    }

    if (_viewModel.messages.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
        children: [
          if (_viewModel.errorMessage != null)
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
            )
          else
            const EtatVide(
              icone: Icons.chat_bubble_outline_rounded,
              titre: 'Aucune conversation',
              description: 'Posez votre question à la gestion locative, elle vous répondra ici.',
            ),
        ],
      );
    }

    final messages = _viewModel.messages.reversed.toList();

    return RefreshIndicator(
      color: AppColors.bleuBouton,
      onRefresh: () => _viewModel.charger(silencieux: true),
      child: ListView.builder(
        reverse: true,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        itemCount: messages.length,
        itemBuilder: (context, index) {
          final message = messages[index];
          final suivant = index + 1 < messages.length
              ? messages[index + 1]
              : null;
          final memeExpediteur = suivant?.expediteur == message.expediteur;

          return Padding(
            padding: EdgeInsets.only(top: memeExpediteur ? 3 : 10),
            child: _bulle(message),
          );
        },
      ),
    );
  }

  Widget _bulle(MessageModel message) {
    final deMoi = message.estLocataire;

    return Row(
      mainAxisAlignment: deMoi
          ? MainAxisAlignment.end
          : MainAxisAlignment.start,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (!deMoi)
          Container(
            width: 28,
            height: 28,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFEDF1FC),
              borderRadius: BorderRadius.circular(9),
            ),
            child: const Icon(
              Icons.support_agent_rounded,
              color: AppColors.bleuBouton,
              size: 16,
            ),
          ),
        Flexible(
          child: Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.72,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: deMoi ? AppColors.bleuBouton : AppColors.blanc,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft: Radius.circular(deMoi ? 16 : 4),
                bottomRight: Radius.circular(deMoi ? 4 : 16),
              ),
              border: deMoi ? null : Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: deMoi
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: [
                Text(
                  message.contenu,
                  style: TextStyle(
                    color: deMoi ? AppColors.blanc : AppColors.bleuprofond,
                    fontSize: 13.5,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  formaterDateHeure(message.creeLe),
                  style: TextStyle(
                    color: deMoi
                        ? AppColors.blanc.withValues(alpha: 0.7)
                        : Colors.grey.shade500,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _compositeur() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 12, 10),
      decoration: BoxDecoration(
        color: AppColors.blanc,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: _viewModel.messageController,
              minLines: 1,
              maxLines: 4,
              maxLength: 2000,
              onChanged: (_) => _viewModel.clearError(),
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(
                hintText: 'Écrire un message...',
                hintStyle: TextStyle(
                  color: Colors.grey.shade400,
                  fontSize: 13.5,
                ),
                counterText: '',
                filled: true,
                fillColor: const Color(0xFFF3F4F6),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: const BorderSide(
                    color: AppColors.bleuBouton,
                    width: 1.3,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 44,
            height: 44,
            child: ElevatedButton(
              onPressed: _viewModel.envoiEnCours ? null : _envoyer,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.bleuBouton,
                foregroundColor: AppColors.blanc,
                elevation: 0,
                padding: EdgeInsets.zero,
                shape: const CircleBorder(),
              ),
              child: _viewModel.envoiEnCours
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        color: AppColors.blanc,
                        strokeWidth: 2.2,
                      ),
                    )
                  : const Icon(Icons.send_rounded, size: 19),
            ),
          ),
        ],
      ),
    );
  }
}
