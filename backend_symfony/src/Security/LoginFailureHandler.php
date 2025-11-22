<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;

/**
 * Handler personnalisé pour l'échec de l'authentification
 */
class LoginFailureHandler implements AuthenticationFailureHandlerInterface
{
    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): JsonResponse
    {
        $message = 'Mauvais identifiant';
        
        // Messages plus spécifiques selon le type d'erreur
        if ($exception instanceof BadCredentialsException) {
            $message = 'Mauvais identifiant';
        } elseif ($exception instanceof UserNotFoundException) {
            $message = 'Mauvais identifiant';
        }

        return new JsonResponse([
            'message' => $message,
            'error' => 'Mauvais identifiant',
        ], JsonResponse::HTTP_UNAUTHORIZED);
    }
}