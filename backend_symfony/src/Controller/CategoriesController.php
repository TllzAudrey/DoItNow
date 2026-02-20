<?php

namespace App\Controller;

use App\Entity\TaskCategory;
use App\Repository\TaskCategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class CategoriesController extends AbstractController
{
    // CREATE
    #[Route('/api/admin/categories', name: 'category_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['label']) || !isset($data['color'])) {
            return $this->json(['error' => 'Label and color are required'], 400);
        }

        $category = new TaskCategory();
        $category->setLabel($data['label']);
        $category->setColor($data['color']);

        $em->persist($category);
        $em->flush();

        return $this->json([
            'message' => 'Category created successfully',
            'id' => $category->getId(),
            'label' => $category->getLabel(),
            'color' => $category->getColor(),
        ], 201);
    }

    // READ ALL
    #[Route('/api/categories', name: 'category_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(TaskCategoryRepository $categoryRepository): JsonResponse
    {
        $categories = $categoryRepository->findAll();
        if (count($categories) < 1) {
            // Créer une catégorie par défaut
            $defaultCategory = new TaskCategory();
            $defaultCategory->setLabel('catégorie 1');
            $defaultCategory->setColor('#5a6268');
            $em = $this->getDoctrine()->getManager();
            $em->persist($defaultCategory);
            $em->flush();
            // Rafraîchir la liste
            $categories = $categoryRepository->findAll();
        }

        $data = array_map(static function (TaskCategory $category) {
            return [
                'id' => $category->getId(),
                'label' => $category->getLabel(),
                'color' => $category->getColor(),
            ];
        }, $categories);

        return $this->json($data);
    }

    // READ ONE
    #[Route('/api/categories/{id}', name: 'category_get', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getOne(TaskCategoryRepository $categoryRepository, int $id): JsonResponse
    {
        $category = $categoryRepository->find($id);

        if (!$category) {
            return $this->json(['error' => 'Category not found'], 404);
        }

        return $this->json([
            'id' => $category->getId(),
            'label' => $category->getLabel(),
            'color' => $category->getColor(),
        ]);
    }

    // UPDATE
    #[Route('/api/admin/categories/{id}', name: 'category_update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request, EntityManagerInterface $em, TaskCategoryRepository $categoryRepository): JsonResponse
    {
        $category = $categoryRepository->find($id);

        if (!$category) {
            return $this->json(['error' => 'Category not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['label'])) {
            $category->setLabel($data['label']);
        }
        if (isset($data['color'])) {
            $category->setColor($data['color']);
        }

        $em->flush();

        return $this->json([
            'message' => 'Category updated successfully',
            'id' => $category->getId(),
            'label' => $category->getLabel(),
            'color' => $category->getColor(),
        ]);
    }

    // DELETE
    #[Route('/api/admin/categories/{id}', name: 'category_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id, EntityManagerInterface $em, TaskCategoryRepository $categoryRepository): JsonResponse
    {
        $category = $categoryRepository->find($id);

        if (!$category) {
            return $this->json(['error' => 'Category not found'], 404);
        }

        // Mettre à null la catégorie des tâches associées
        foreach ($category->getTasks() as $task) {
            $task->setCategory(null);
        }

        $em->remove($category);
        $em->flush();

        return $this->json(['message' => 'Category deleted successfully']);
    }
}
