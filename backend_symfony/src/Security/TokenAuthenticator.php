<?php

namespace App\Security;

use App\Repository\UsersRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

/**
 * Authenticator pour l'authentification par token API
 * 
 * Pour utiliser cet authenticator, envoyez un header:
 * Authorization: Bearer <token>
 * 
 * Ou utilisez un paramètre de requête: ?token=<token>
 */
class TokenAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private readonly UsersRepository $usersRepository
    ) {
    }

    /**
     * Vérifie si cette requête doit être authentifiée
     */
    public function supports(Request $request): ?bool
    {
        // Vérifie si un token est présent dans les headers ou les paramètres
        return $request->headers->has('Authorization') 
            || $request->query->has('token')
            || $request->request->has('token');
    }

    /**
     * Authentifie l'utilisateur
     */
    public function authenticate(Request $request): Passport
    {
        $token = $this->getTokenFromRequest($request);

        if (!$token) {
            error_log("TokenAuthenticator: Token manquant");
            throw new AuthenticationException('Token manquant');
        }

        error_log("TokenAuthenticator: Token reçu (début): " . substr($token, 0, 50));

        // Valide le JWT généré par LoginSuccessHandler
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            error_log("TokenAuthenticator: Token invalide - nombre de parties: " . count($parts));
            throw new AuthenticationException('Token invalide');
        }

        [$base64UrlHeader, $base64UrlPayload, $base64UrlSignature] = $parts;

        // Décode le payload
        $payload = json_decode(base64_decode(strtr($base64UrlPayload, '-_', '+/')), true);
        
        if (!$payload || !isset($payload['email'])) {
            error_log("TokenAuthenticator: Payload invalide ou email manquant");
            throw new AuthenticationException('Token invalide');
        }

        error_log("TokenAuthenticator: Email du token: " . $payload['email']);

        // Vérifie l'expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            error_log("TokenAuthenticator: Token expiré - exp: " . $payload['exp'] . ", now: " . time());
            throw new AuthenticationException('Token expiré');
        }

        // Vérifie la signature
        $secret = 'LeTokenDoitEtreSecretNestPasGregoire?';
        $expectedSignature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $expectedBase64UrlSignature = rtrim(strtr(base64_encode($expectedSignature), '+/', '-_'), '=');
        
        if (!hash_equals($expectedBase64UrlSignature, $base64UrlSignature)) {
            error_log("TokenAuthenticator: Signature invalide");
            throw new AuthenticationException('Token invalide - signature incorrecte');
        }

        $user = $this->usersRepository->findOneByEmail($payload['email']);

        if (!$user) {
            error_log("TokenAuthenticator: Utilisateur non trouvé pour email: " . $payload['email']);
            throw new UserNotFoundException('Utilisateur non trouvé');
        }

        error_log("TokenAuthenticator: Authentification réussie pour: " . $user->getEmail());

        return new SelfValidatingPassport(
            new UserBadge($user->getUserIdentifier())
        );
    }

    /**
     * Extrait le token de la requête
     */
    private function getTokenFromRequest(Request $request): ?string
    {
        // Vérifie le header Authorization: Bearer <token>
        $authHeader = $request->headers->get('Authorization');
        if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        // Vérifie les paramètres de requête
        if ($request->query->has('token')) {
            return $request->query->get('token');
        }

        // Vérifie les données POST
        if ($request->request->has('token')) {
            return $request->request->get('token');
        }

        return null;
    }

    /**
     * Appelé en cas de succès de l'authentification
     */
    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null; // La requête continue normalement
    }

    /**
     * Appelé en cas d'échec de l'authentification
     */
    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse([
            'message' => 'Authentification échouée',
            'error' => $exception->getMessage(),
        ], Response::HTTP_UNAUTHORIZED);
    }
}

