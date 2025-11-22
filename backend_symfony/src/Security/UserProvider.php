<?php

namespace App\Security;

use App\Entity\Users;
use App\Repository\UsersRepository;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

/**
 * UserProvider personnalisé pour charger les utilisateurs depuis la base de données
 */
class UserProvider implements UserProviderInterface
{
    public function __construct(
        private readonly UsersRepository $usersRepository
    ) {
    }

    /**
     * Charge un utilisateur par son identifiant (email)
     */
    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        $user = $this->usersRepository->findOneByEmail($identifier);

        if (!$user) {
            throw new UserNotFoundException(sprintf('Utilisateur avec l\'email "%s" introuvable.', $identifier));
        }

        return $user;
    }

    /**
     * Recharge un utilisateur (utilisé lors de la mise à jour de la session)
     */
    public function refreshUser(UserInterface $user): UserInterface
    {
        if (!$user instanceof Users) {
            throw new \InvalidArgumentException(sprintf('Instances de "%s" ne sont pas supportées.', $user::class));
        }

        return $this->loadUserByIdentifier($user->getUserIdentifier());
    }

    /**
     * Vérifie si cette classe supporte le type d'utilisateur donné
     */
    public function supportsClass(string $class): bool
    {
        return Users::class === $class;
    }
}

