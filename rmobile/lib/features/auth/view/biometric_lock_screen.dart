import 'package:flutter/material.dart';
import 'package:rmobile/core/themes/app_colors.dart';
import 'package:rmobile/features/auth/view/login_screen.dart';
import 'package:rmobile/features/auth/viewmodel/biometric_viewmodel.dart';
import 'package:rmobile/features/navigationBar/view/navigation_screen.dart';

class BiometricLockScreen extends StatefulWidget {
  const BiometricLockScreen({super.key});

  @override
  State<BiometricLockScreen> createState() => _BiometricLockScreenState();
}

class _BiometricLockScreenState extends State<BiometricLockScreen> {
  final BiometricViewModel _viewModel = BiometricViewModel();

  @override
  void initState() {
    super.initState();
    _initialiser();
  }

  Future<void> _initialiser() async {
    await _viewModel.verifierTypeBiometrie();
    if (mounted) {
      _lancerVerification();
    }
  }


// Dans _BiometricLockScreenState :
Future<void> _lancerVerification() async {
  final succes = await _viewModel.authentifier();
  if (succes && mounted) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => const NavigationScreen(),
      ),
    );
  }
}


  void _allerVersLogin() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _viewModel,
      builder: (context, child) {
        return Scaffold(
          backgroundColor: AppColors.blanc,
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              child: Column(
                children: [
                  const Spacer(),

                  // Icône dynamique (Visage ou Empreinte) dans un carré arrondi bleu clair
                  Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDF1FC),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Icon(
                      _viewModel.isFaceId ? Icons.face : Icons.fingerprint,
                      color: AppColors.bleuBouton,
                      size: 46,
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Sur-titre
                  Text(
                    "ACCÈS SÉCURISÉ",
                    style: TextStyle(
                      color: AppColors.bleuBouton,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.2,
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Titre principal
                  Text(
                    "Espace verrouillé",
                    style: TextStyle(
                      color: AppColors.bleuprofond,
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Description adaptée au capteur
                  Text(
                    _viewModel.isFaceId
                        ? "Utilisez la reconnaissance faciale pour accéder rapidement à votre espace locataire."
                        : "Utilisez votre empreinte digitale ou votre reconnaissance faciale pour déverrouiller l'application.",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 15,
                      height: 1.5,
                    ),
                  ),

                  // Message d'erreur éventuel
                  if (_viewModel.errorMessage != null) ...[
                    const SizedBox(height: 20),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Text(
                        _viewModel.errorMessage!,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.red.shade700,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 36),

                  // Bouton principal "Déverrouiller"
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.bleuBouton,
                        foregroundColor: AppColors.blanc,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: _viewModel.isAuthenticating
                          ? null
                          : _lancerVerification,
                      icon: const Icon(Icons.lock_open_rounded, size: 20),
                      label: Text(
                        _viewModel.isAuthenticating
                            ? "Vérification en cours..."
                            : "Déverrouiller",
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),

                  const Spacer(),

                  // Lien de secours vers la connexion par numéro SMS
                  TextButton(
                    onPressed: () => _viewModel.seDeconnecter(_allerVersLogin),
                    child: Text(
                      "Se connecter avec mon numéro SMS",
                      style: TextStyle(
                        color: AppColors.bleuBouton,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
