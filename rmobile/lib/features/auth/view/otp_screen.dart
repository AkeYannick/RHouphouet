import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:rmobile/core/themes/app_colors.dart';
import 'package:rmobile/features/auth/view/biometric_lock_screen.dart';
import 'package:rmobile/features/auth/viewmodel/auth_viewmodel.dart';
import 'package:rmobile/features/navigationBar/view/navigation_screen.dart';

class OtpScreen extends StatefulWidget {
  final AuthViewModel viewModel;

  const OtpScreen({super.key, required this.viewModel});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final List<TextEditingController> _controllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

    Future<void> _onValider() async {
    FocusScope.of(context).unfocus();
    _controllers.map((c) => c.text).join();
    widget.viewModel.otpController.text =
        _controllers.map((c) => c.text).join();

    final succes = await widget.viewModel.verifierCodeOtp();
    if (!succes || !mounted) return;

    final biometrie = await widget.viewModel.biometrieDisponible();
    if (!mounted) return;

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (context) => biometrie
            ? const BiometricLockScreen()
            : const NavigationScreen(),
      ),
      (route) => false, // Supprime les écrans Login et OTP de l'historique
    );
  }


  void _viderCases() {
    for (final c in _controllers) {
      c.clear();
    }
    widget.viewModel.resetOtpFields();
    _focusNodes.first.requestFocus();
  }

  void _remplirCodeDemo() {
    final code = widget.viewModel.codeDemo;
    if (code == null || code.length != 6) return;

    for (var i = 0; i < 6; i++) {
      _controllers[i].text = code[i];
    }
    widget.viewModel.otpController.text = code;
    _focusNodes.last.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.viewModel,
      builder: (context, child) {
        final hasError = widget.viewModel.errorMessage != null;

        return Scaffold(
          backgroundColor: AppColors.blanc,
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Bouton retour circulaire
                  InkWell(
                    onTap: () {
                      widget.viewModel.clearError();
                      Navigator.of(context).pop();
                    },
                    borderRadius: BorderRadius.circular(24),
                    child: Container(
                      width: 42,
                      height: 42,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF3F4F6),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.chevron_left,
                        color: AppColors.bleuprofond,
                        size: 24,
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Icône SMS dans un carré arrondi bleu très clair
                  Container(
                    width: 70,
                    height: 70,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDF1FC),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Icon(
                      Icons.chat_outlined,
                      color: AppColors.bleuBouton,
                      size: 28,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Titre principal
                  Text(
                    "Vérifiez votre téléphone",
                    style: TextStyle(
                      color: AppColors.bleuprofond,
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                    ),
                  ),

                  const SizedBox(height: 10),

                  // Texte avec numéro masqué en gras
                  RichText(
                    text: TextSpan(
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 15,
                        height: 1.5,
                      ),
                      children: [
                        const TextSpan(
                          text:
                              "Saisissez le code à 6 chiffres envoyé par SMS au\n",
                        ),
                        TextSpan(
                          text: "${widget.viewModel.maskedPhoneNumber}.",
                          style: TextStyle(
                            color: AppColors.bleuprofond,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Code de démonstration tant qu'aucun fournisseur SMS n'est branché
                  if (widget.viewModel.codeDemo != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEDF1FC),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFC7D9F5)),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.science_outlined,
                            color: AppColors.bleuBouton,
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              "Mode démonstration · code : ${widget.viewModel.codeDemo}",
                              style: const TextStyle(
                                color: AppColors.bleuprofond,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: _remplirCodeDemo,
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.bleuBouton,
                              padding: EdgeInsets.zero,
                              minimumSize: const Size(0, 0),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: const Text(
                              "Remplir",
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),

                  // 6 cases OTP 100% natives Flutter
                  Row(
                    children: List.generate(6, (index) {
                      return Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(right: index < 5 ? 8 : 0),
                          child: SizedBox(
                            height: 56,
                            child: TextField(
                              controller: _controllers[index],
                              focusNode: _focusNodes[index],
                              autofocus: index == 0,
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                                LengthLimitingTextInputFormatter(1),
                              ],
                              style: TextStyle(
                                color: AppColors.bleuprofond,
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                              ),
                              onChanged: (value) {
                                widget.viewModel.clearError();
                                if (value.isNotEmpty) {
                                  if (index < 5) {
                                    _focusNodes[index + 1].requestFocus();
                                  } else {
                                    _onValider();
                                  }
                                } else if (value.isEmpty && index > 0) {
                                  _focusNodes[index - 1].requestFocus();
                                }
                              },
                              decoration: InputDecoration(
                                counterText: "",
                                contentPadding: EdgeInsets.zero,
                                filled: true,
                                fillColor: AppColors.blanc,
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: BorderSide(
                                    color: hasError
                                        ? Colors.red.shade400
                                        : Colors.grey.shade300,
                                    width: 1.2,
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: BorderSide(
                                    color: hasError
                                        ? Colors.red.shade400
                                        : AppColors.bleuBouton,
                                    width: 1.8,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),

                  // Message d'erreur éventuel
                  if (hasError) ...[
                    const SizedBox(height: 14),
                    Text(
                      widget.viewModel.errorMessage!,
                      style: TextStyle(
                        color: Colors.red.shade600,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],

                  const SizedBox(height: 28),

                  // Bouton principal
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.bleuBouton,
                        foregroundColor: AppColors.blanc,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: widget.viewModel.isLoading ? null : _onValider,
                      child: widget.viewModel.isLoading
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                color: AppColors.blanc,
                                strokeWidth: 2.5,
                              ),
                            )
                          : const Text(
                              "Valider et me connecter",
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                          ),
),
),
const SizedBox(height: 24),
// Lien Renvoyer le code
Center(
child: GestureDetector(
onTap: widget.viewModel.isLoading
? null
: () async {
_viderCases();
await widget.viewModel.envoyerCodeOtp();
if (mounted) {
ScaffoldMessenger.of(this.context).showSnackBar(
  const SnackBar(
content:
Text("Un nouveau code a été envoyé."),
),
);
}
},
child: RichText(
text: TextSpan(
style: TextStyle(
color: Colors.grey.shade600,
fontSize: 14,
),
children: [
const TextSpan(text: "Vous n'avez rien reçu ? "),
TextSpan(
text: "Renvoyer le code",
style: TextStyle(
color: AppColors.bleuBouton,
fontWeight: FontWeight.w700,
),
),
],
),
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