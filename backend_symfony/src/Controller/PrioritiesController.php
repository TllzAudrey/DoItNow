<?php

namespace App\Controller;

use App\Entity\TaskPriority;
use App\Repository\TaskPriorityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class PrioritiesController extends AbstractController
{
    // CREATE
    #[Route('/api/admin/priorities', name: 'priority_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['label'])) {
            return $this->json(['error' => 'Label is required'], 400);
        }

        $priority = new TaskPriority();
        $priority->setLabel($data['label']);

        $em->persist($priority);
        $em->flush();

        return $this->json([
            'message' => 'Priority created successfully',
            'id' => $priority->getId(),
            'label' => $priority->getLabel(),
        ], 201);
    }

    // READ ALL
    #[Route('/api/priorities', name: 'priority_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(TaskPriorityRepository $priorityRepository): JsonResponse
    {
        $priorities = $priorityRepository->findAll();

        $data = array_map(static function (TaskPriority $priority) {
            return [
                'id' => $priority->getId(),
                'label' => $priority->getLabel(),
            ];
        }, $priorities);

        return $this->json($data);
    }

    // READ ONE
    #[Route('/api/priorities/{id}', name: 'priority_get', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getOne(TaskPriorityRepository $priorityRepository, int $id): JsonResponse
    {
        $priority = $priorityRepository->find($id);

        if (!$priority) {
            return $this->json(['error' => 'Priority not found'], 404);
        }

        return $this->json([
            'id' => $priority->getId(),
            'label' => $priority->getLabel(),
        ]);
    }

    // UPDATE
    #[Route('/api/admin/priorities/{id}', name: 'priority_update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request, EntityManagerInterface $em, TaskPriorityRepository $priorityRepository): JsonResponse
    {
        $priority = $priorityRepository->find($id);

        if (!$priority) {
            return $this->json(['error' => 'Priority not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['label'])) {
            $priority->setLabel($data['label']);
        }

        $em->flush();

        return $this->json([
            'message' => 'Priority updated successfully',
            'id' => $priority->getId(),
            'label' => $priority->getLabel(),
        ]);
    }

    // DELETE
    #[Route('/api/admin/priorities/{id}', name: 'priority_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id, EntityManagerInterface $em, TaskPriorityRepository $priorityRepository): JsonResponse
    {
        $priority = $priorityRepository->find($id);

        if (!$priority) {
            return $this->json(['error' => 'Priority not found'], 404);
        }

        // Mettre à null la priorité des tâches associées
        foreach ($priority->getTasks() as $task) {
            $task->setPriority(null);
        }

        $em->remove($priority);
        $em->flush();

        return $this->json(['message' => 'Priority deleted successfully']);
    }
}
