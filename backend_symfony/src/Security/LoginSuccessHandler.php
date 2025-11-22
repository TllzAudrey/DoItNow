<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;

/**
 * Handler personnalisé pour le succès de l'authentification
 * Retourne un token au lieu de rediriger
 */
class LoginSuccessHandler implements AuthenticationSuccessHandlerInterface
{
    public function onAuthenticationSuccess(Request $request, TokenInterface $token): JsonResponse
    {
        $user = $token->getUser();

        // Récupère le paramètre rememberMe de la requête
        $data = json_decode($request->getContent(), true);
        $rememberMe = isset($data['rememberMe']) ? (bool)$data['rememberMe'] : false;

        // Détermine la durée du token selon rememberMe
        // Si rememberMe = true : 24 heures
        // Si rememberMe = false : 1 heure (session courte)
        $tokenDuration = $rememberMe ? 86400 : 3600;

        // Génère un token JWT
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $payload = [
            'sub' => $user->getId(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
            'iat' => time(),
            'exp' => time() + $tokenDuration,
            'rememberMe' => $rememberMe, // Ajout du flag pour référence
        ];
        $secret = 'LeTokenDoitEtreSecretNestPasGregoire?';

        $base64UrlHeader = rtrim(strtr(base64_encode(json_encode($header)), '+/', '-_'), '=');
        $base64UrlPayload = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $base64UrlSignature = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        $tokenValue = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

        return new JsonResponse([
            'message' => 'Authentification réussie',
            'token' => $tokenValue,
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'pseudo' => $user->getPseudo(),
                'roles' => $user->getRoles(),
            ],
        ]);
    }
}

