<?php

namespace App\Controller;

use App\Entity\Users;
use App\Repository\UsersRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class UsersController extends AbstractController
{
    // CREATE
    #[Route('/api/admin/users', name: 'user_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request, EntityManagerInterface $em, UserPasswordHasherInterface $passwordHasher, UsersRepository $usersRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Validation des champs requis
        if (!isset($data['pseudo']) || !isset($data['email']) || !isset($data['password'])) {
            return $this->json(['error' => 'Pseudo, email and password are required'], 400);
        }

        // Vérifier si l'email existe déjà
        $existingUser = $usersRepository->findOneByEmail($data['email']);
        if ($existingUser) {
            return $this->json(['error' => 'Email already exists'], 409);
        }

        // Vérifier si le pseudo existe déjà
        $existingPseudo = $usersRepository->findOneByPseudo($data['pseudo']);
        if ($existingPseudo) {
            return $this->json(['error' => 'Pseudo already exists'], 409);
        }

        $user = new Users();
        $user->setPseudo($data['pseudo']);
        $user->setEmail($data['email']);
        
        // Hasher le mot de passe
        $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);
        
        // Définir le rôle (0 = ROLE_USER uniquement, interdire 1 = ROLE_ADMIN)
        $role = isset($data['role']) ? (int)$data['role'] : 0;
        if ($role === 1) {
            return $this->json([
                'error' => 'Impossible de créer un administrateur depuis l\'interface. Veuillez utiliser la base de données directement.'
            ], 403);
        }
        $user->setRole($role);

        $em->persist($user);
        $em->flush();

        return $this->json([
            'message' => 'User created successfully',
            'id' => $user->getId(),
            'pseudo' => $user->getPseudo(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
        ], 201);
    }

    // READ ALL
    #[Route('/api/admin/users', name: 'user_list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function list(UsersRepository $usersRepository): JsonResponse
    {
        $users = $usersRepository->findAll();

        $data = array_map(static function (Users $user) {
            return [
                'id' => $user->getId(),
                'pseudo' => $user->getPseudo(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
            ];
        }, $users);

        return $this->json($data);
    }

    // READ ONE
    #[Route('/api/admin/users/{id}', name: 'user_get', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function getOne(UsersRepository $usersRepository, int $id): JsonResponse
    {
        $user = $usersRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        return $this->json([
            'id' => $user->getId(),
            'pseudo' => $user->getPseudo(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
        ]);
    }

    // UPDATE
    #[Route('/api/admin/users/{id}', name: 'user_update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request, EntityManagerInterface $em, UsersRepository $usersRepository, UserPasswordHasherInterface $passwordHasher): JsonResponse
    {
        $user = $usersRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        // Mise à jour du pseudo
        if (isset($data['pseudo'])) {
            // Vérifier si le pseudo existe déjà (sauf pour l'utilisateur actuel)
            $existingPseudo = $usersRepository->findOneByPseudo($data['pseudo']);
            if ($existingPseudo && $existingPseudo->getId() !== $user->getId()) {
                return $this->json(['error' => 'Pseudo already exists'], 409);
            }
            $user->setPseudo($data['pseudo']);
        }

        // Mise à jour de l'email
        if (isset($data['email'])) {
            // Vérifier si l'email existe déjà (sauf pour l'utilisateur actuel)
            $existingEmail = $usersRepository->findOneByEmail($data['email']);
            if ($existingEmail && $existingEmail->getId() !== $user->getId()) {
                return $this->json(['error' => 'Email already exists'], 409);
            }
            $user->setEmail($data['email']);
        }

        // Mise à jour du mot de passe (seulement si fourni)
        if (isset($data['password']) && !empty($data['password'])) {
            $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
            $user->setPassword($hashedPassword);
        }

        // Mise à jour du rôle (interdire de MODIFIER le rôle d'un admin ou de PASSER à admin)
        if (isset($data['role'])) {
            $newRole = (int)$data['role'];
            $currentRole = $user->getRole();
            
            // Bloquer si on tente de changer le rôle d'un admin (1 -> 0 ou garder 1)
            // ou de passer à admin (0 -> 1)
            if ($currentRole === 1 && $newRole !== $currentRole) {
                return $this->json([
                    'error' => 'Impossible de modifier le rôle d\'un administrateur depuis l\'interface. Veuillez utiliser la base de données directement.'
                ], 403);
            }
            
            if ($newRole === 1 && $currentRole !== 1) {
                return $this->json([
                    'error' => 'Impossible de définir le rôle administrateur depuis l\'interface. Veuillez utiliser la base de données directement.'
                ], 403);
            }
            
            $user->setRole($newRole);
        }

        $em->flush();

        return $this->json([
            'message' => 'User updated successfully',
            'id' => $user->getId(),
            'pseudo' => $user->getPseudo(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
        ]);
    }

    // DELETE
    #[Route('/api/admin/users/{id}', name: 'user_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id, EntityManagerInterface $em, UsersRepository $usersRepository): JsonResponse
    {
        $user = $usersRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        // Empêcher la suppression d'un administrateur
        if (in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return $this->json([
                'error' => 'Impossible de supprimer un administrateur depuis l\'interface. Veuillez utiliser la base de données directement.'
            ], 403);
        }

        $em->remove($user);
        $em->flush();

        return $this->json(['message' => 'User deleted successfully']);
    }
}
