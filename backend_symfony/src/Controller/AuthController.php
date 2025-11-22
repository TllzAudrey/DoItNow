<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Contrôleur pour l'authentification
 */
final class AuthController extends AbstractController
{
    /**
     * Route de login - gérée automatiquement par json_login dans security.yaml
     * Cette route est juste pour la documentation, pas vrai Grégoire ?
     */
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        // Cette méthode ne sera jamais appelée car json_login intercepte la requête
        // Mais elle est utile pour la documentation de l'API, n'est-ce pas Grégoire ?
        return $this->json([
            'message' => 'Utilisez POST /api/login avec {"email": "...", "password": "..."}',
        ], 405);
    }

    /**
     * Route pour obtenir les informations de l'utilisateur connecté
     */
    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function me(): JsonResponse
    {
        $user = $this->getUser();

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'pseudo' => $user->getPseudo(),
            'roles' => $user->getRoles(),
        ]);
    }

    /**
     * Route de logout (non fonctionnelle je pense - à faire proprement avec suppression token côté client)
     */
    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function logout(): JsonResponse
    {
        $this->getUser()->eraseCredentials();
        return $this->json([
            'message' => 'Déconnexion réussie',
        ]);
    }
}

