import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:rmobile/core/themes/app_colors.dart';
import 'package:rmobile/features/auth/view/otp_screen.dart';
import 'package:rmobile/features/auth/viewmodel/auth_viewmodel.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final AuthViewModel _viewModel = AuthViewModel();

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  Future<void> _onContinuer() async {
    FocusScope.of(context).unfocus();
    final succes = await _viewModel.envoyerCodeOtp();
    if (succes && mounted) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => OtpScreen(viewModel: _viewModel),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _viewModel,
      builder: (context, child) {
        return Scaffold(
          backgroundColor: AppColors.blanc,
          body: SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight - 40,
                    ),
                    child: IntrinsicHeight(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 24),

                          // Sur-titre
                          Text(
                            "HEUREUX DE VOUS REVOIR",
                            style: TextStyle(
                              color: AppColors.bleuBouton,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.1,
                            ),
                          ),

                          const SizedBox(height: 10),

                          // Titre principal
                          Text(
                            "Connectez-vous\nà votre espace.",
                            style: TextStyle(
                              color: AppColors.bleuprofond,
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                              height: 1.15,
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Sous-titre
                          Text(
                            "Entrez votre numéro de téléphone pour recevoir votre code de connexion.",
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 15,
                              height: 1.45,
                            ),
                          ),

                          const SizedBox(height: 36),

                          // Label du champ
                          Text(
                            "Numéro de téléphone",
                            style: TextStyle(
                              color: AppColors.bleuprofond,
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),

                          const SizedBox(height: 10),

                          // Champ téléphone avec CI +225
                          TextField(
                            controller: _viewModel.phoneController,
                            keyboardType: TextInputType.phone,
                            onChanged: (_) => _viewModel.clearError(),
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(10),
                              _PhoneSpacingFormatter(),
                            ],
                            style: TextStyle(
                              color: AppColors.bleuprofond,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1,
                            ),
                            decoration: InputDecoration(
                              hintText: "07 07 07 07 07",
                              hintStyle: TextStyle(
                                color: Colors.grey.shade400,
                                fontWeight: FontWeight.w500,
                              ),
                              prefixIcon: Padding(
                                padding:
                                    const EdgeInsets.only(left: 16, right: 12),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      "CI  +225",
                                      style: TextStyle(
                                        color: AppColors.bleuprofond,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Container(
                                      height: 22,
                                      width: 1,
                                      color: Colors.grey.shade300,
                                    ),
                                  ],
                                ),
                              ),
                              filled: true,
                              fillColor: const Color(0xFFF3F4F6),
                              contentPadding: const EdgeInsets.symmetric(
                                vertical: 18,
                                horizontal: 16,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: BorderSide.none,
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: BorderSide(
                                  color: AppColors.bleuBouton,
                                  width: 1.5,
                                ),
                              ),
                            ),
                          ),

                          // Message d'erreur éventuel
                          if (_viewModel.errorMessage != null) ...[
                            const SizedBox(height: 12),
                            Text(
                              _viewModel.errorMessage!,
                              style: TextStyle(
                                color: Colors.red.shade600,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],

                          const SizedBox(height: 24),

                          // Bouton principal "Recevoir mon code →"
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
                              onPressed:
                                  _viewModel.isLoading ? null : _onContinuer,
                              iconAlignment: IconAlignment.end,
                              icon: _viewModel.isLoading
                                  ? const SizedBox.shrink()
                                  : const Icon(Icons.arrow_right_alt, size: 22),
                              label: _viewModel.isLoading
                                  ? const SizedBox(
                                      height: 22,
                                      width: 22,
                                      child: CircularProgressIndicator(
                                        color: AppColors.blanc,
                                        strokeWidth: 2.5,
                                      ),
                                    )
                                  : const Text(
                                      "Recevoir mon code",
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Mention Code unique envoyé par SMS
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                            Icon(Icons.verified_user_outlined, size: 16, color: Colors.grey.shade500,),
                            const SizedBox(width: 6),
                            Text("Code unique envoyé par SMS",
                            style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 13,
                            ),
                            ),
                            ],
                            ),
                            // Pied de page : Besoin d'aide ? Contactez-nous
                            Center(
                            child: GestureDetector(
                            onTap: () {
                              // TODO: Action support / WhatsApp bailleur
                              },
                              child: RichText(
                              text: TextSpan(
                              style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 14,
                              ),
                              children: [
                              const TextSpan(text: "Besoin d'aide ? "),
                              TextSpan(
                              text: "Contactez-nous",
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
                              ),
                              ),
                              );
                              },
                              );
                              }
                              }
                              /// Formate automatiquement le numéro par paires (ex: 07 07 07 07 07)
                              class _PhoneSpacingFormatter extends TextInputFormatter {
                              @override
                              TextEditingValue formatEditUpdate(
                              TextEditingValue oldValue,
                              TextEditingValue newValue,
                              ) {
                              final digits = newValue.text.replaceAll(' ', '');
                              final buffer = StringBuffer();
                              for (int i = 0; i < digits.length; i++) {
                              buffer.write(digits[i]);
                              if ((i + 1) % 2 == 0 && i + 1 != digits.length) {
                              buffer.write(' ');
                              }
                              }
                              final formatted = buffer.toString();
                              return TextEditingValue(
                              text: formatted,
                              selection: TextSelection.collapsed(offset: formatted.length),
                              );
                              }
                              }

