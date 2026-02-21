<?php

namespace App\Controller;

use App\Entity\Tasks as TaskEntity;
use App\Entity\TaskHistory;
use App\Entity\TaskStatus; 
use App\Entity\UsersTasks;
use App\Repository\TasksRepository;
use App\Repository\TaskHistoryRepository;
use App\Repository\UsersTasksRepository;
use App\Repository\TaskStatusRepository;
use App\Repository\TaskCategoryRepository;
use App\Repository\TaskPriorityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class TasksController extends AbstractController
{
    #[Route('/tasks', name: 'app_tasks')]
    public function index(): JsonResponse
    {
        return $this->json([
            'message' => 'Welcome to your new controller!',
            'path' => 'src/Controller/TasksController.php',
        ]);
    }

    #[Route('/api/tasks', name: 'tasks_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(TasksRepository $tasksRepository): JsonResponse
    {
        try {
            $user = $this->getUser();
            
            if (!$user) {
                return $this->json(['error' => 'Utilisateur non authentifié'], 401);
            }

            // Récupérer uniquement les tâches non archivées de l'utilisateur
            $tasks = $tasksRepository->createQueryBuilder('t')
                ->leftJoin('t.usersTasks', 'ut')
                ->where('ut.user = :user')
                ->andWhere('t.isArchived = :archived')
                ->setParameter('user', $user)
                ->setParameter('archived', false)
                ->orderBy('t.id', 'DESC')
                ->getQuery()
                ->getResult();

            $data = array_map(static function (TaskEntity $task): array {
                return [
                    'id' => $task->getId(),
                    'name' => $task->getName(),
                    'description' => $task->getDescription(),
                    'dueDate' => $task->getDueDate()?->format(DATE_ATOM),
                    'isArchived' => $task->isArchived(),
                    // Expose le statut réel de la tâche depuis la BDD
                    'status' => $task->getStatus() ? [
                        'id' => $task->getStatus()->getId(),
                        'label' => $task->getStatus()->getLabel(),
                    ] : null,
                    'category' => $task->getCategory() ? [
                        'id' => $task->getCategory()->getId(),
                        'label' => $task->getCategory()->getLabel(),
                        'color' => $task->getCategory()->getColor(),
                    ] : null,
                    'priority' => $task->getPriority() ? [
                        'id' => $task->getPriority()->getId(),
                        'label' => $task->getPriority()->getLabel(),
                    ] : null,
                ];
            }, $tasks);

            return $this->json($data);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Erreur lors de la récupération des tâches',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    }

    #[Route('/api/tasks/search', name: 'tasks_search_user', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function searchUserTasks(Request $request, TasksRepository $tasksRepository): JsonResponse
    {
        try {
            $user = $this->getUser();
            
            if (!$user) {
                return $this->json(['error' => 'Utilisateur non authentifié'], 401);
            }

            $query = $request->query->get('q', '');
            
            if (empty(trim($query))) {
                return $this->json([]);
            }

            // Recherche dans la base de données avec QueryBuilder (comme pour les admins)
            $tasks = $tasksRepository->createQueryBuilder('t')
                ->leftJoin('t.usersTasks', 'ut')
                ->leftJoin('t.category', 'c')
                ->leftJoin('t.priority', 'p')
                // Jointure statut pour permettre la recherche par label de statut
                ->leftJoin('t.status', 's')
                ->where('ut.user = :user')
                ->andWhere('t.isArchived = :archived')
                // Recherche étendue : nom, description, catégorie, priorité, statut
                ->andWhere('(t.name LIKE :query OR t.description LIKE :query OR c.label LIKE :query OR p.label LIKE :query OR s.label LIKE :query)')
                ->setParameter('user', $user)
                ->setParameter('archived', false)
                ->setParameter('query', '%' . $query . '%')
                ->orderBy('t.id', 'DESC')
                ->setMaxResults(50)
                ->getQuery()
                ->getResult();

            $data = array_map(static function (TaskEntity $task): array {
                return [
                    'id' => $task->getId(),
                    'name' => $task->getName(),
                    'description' => $task->getDescription(),
                    'dueDate' => $task->getDueDate()?->format(DATE_ATOM),
                    'isArchived' => $task->isArchived(),
                    // Expose le statut réel de la tâche depuis la BDD
                    'status' => $task->getStatus() ? [
                        'id' => $task->getStatus()->getId(),
                        'label' => $task->getStatus()->getLabel(),
                    ] : null,
                    'category' => $task->getCategory() ? [
                        'id' => $task->getCategory()->getId(),
                        'label' => $task->getCategory()->getLabel(),
                        'color' => $task->getCategory()->getColor(),
                    ] : null,
                    'priority' => $task->getPriority() ? [
                        'id' => $task->getPriority()->getId(),
                        'label' => $task->getPriority()->getLabel(),
                    ] : null,
                ];
            }, $tasks);

            return $this->json($data);
        } catch (\Exception $e) {
            error_log("Error searching user tasks: " . $e->getMessage());
            return $this->json([
                'error' => 'Erreur lors de la recherche',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/api/admin/tasks/all', name: 'tasks_list_all', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function listAll(TasksRepository $tasksRepository): JsonResponse
    {
        $tasks = $tasksRepository->findAll();

        $data = array_map(static function (TaskEntity $task): array {
            // Récupérer l'utilisateur via UsersTasks
            $usersTasks = $task->getUsersTasks();
            $user = $usersTasks?->getUser();
            
            return [
                'id' => $task->getId(),
                'name' => $task->getName(),
                'description' => $task->getDescription(),
                'dueDate' => $task->getDueDate()?->format(DATE_ATOM),
                'isArchived' => $task->isArchived(),
                'user' => $user ? [
                    'id' => $user->getId(),
                    'pseudo' => $user->getPseudo(),
                    'email' => $user->getEmail(),
                ] : null,
                'category' => $task->getCategory() ? [
                    'id' => $task->getCategory()->getId(),
                    'label' => $task->getCategory()->getLabel(),
                    'color' => $task->getCategory()->getColor(),
                ] : null,
                'priority' => $task->getPriority() ? [
                    'id' => $task->getPriority()->getId(),
                    'label' => $task->getPriority()->getLabel(),
                ] : null,
                'status' => $task->getStatus() ? [
                    'id' => $task->getStatus()->getId(),
                    'label' => $task->getStatus()->getLabel(),
                ] : null,
            ];
        }, $tasks);

        return $this->json($data);
    }

    #[Route('/api/tasks', name: 'tasks_create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        TaskStatusRepository $taskStatusRepository,
        TaskCategoryRepository $taskCategoryRepository,
        TaskPriorityRepository $taskPriorityRepository
    ): JsonResponse {
        try {
            $user = $this->getUser();
            
            if (!$user) {
                return $this->json(['error' => 'Utilisateur non authentifié'], 401);
            }

            $data = json_decode($request->getContent(), true);

            if (!isset($data['name']) || empty(trim($data['name']))) {
                return $this->json(['error' => 'Le nom de la tâche est requis'], 400);
            }

            // Créer la nouvelle tâche
            $task = new TaskEntity();
            $task->setName(trim($data['name']));
            $task->setDescription($data['description'] ?? null);
            $task->setIsArchived($data['isArchived'] ?? false);

            // Gérer la date d'échéance
            if (isset($data['dueDate']) && !empty($data['dueDate'])) {
                try {
                    $dueDate = new \DateTime($data['dueDate']);
                    $task->setDueDate($dueDate);
                } catch (\Exception $e) {
                    return $this->json(['error' => 'Format de date invalide'], 400);
                }
            }

            // Récupérer un statut existant ou créer le statut par défaut
            $status = $this->getOrCreateDefaultStatus($taskStatusRepository, $em);

            $task->setStatus($status);

            // Gérer la catégorie
            if (isset($data['categoryId']) && !empty($data['categoryId'])) {
                $category = $taskCategoryRepository->find($data['categoryId']);
                if ($category) {
                    $task->setCategory($category);
                }
            } else {
                // Si aucune catégorie n'est spécifiée, vérifier s'il existe des catégories
                $categories = $taskCategoryRepository->findAll();
                if (count($categories) === 0) {
                    $defaultCategory = $this->getOrCreateDefaultCategory($taskCategoryRepository, $em);
                    $task->setCategory($defaultCategory);
                }
            }

            // Gérer la priorité
            if (isset($data['priorityId']) && !empty($data['priorityId'])) {
                $priority = $taskPriorityRepository->find($data['priorityId']);
                if ($priority) {
                    $task->setPriority($priority);
                }
            }

            // Créer la relation UsersTasks
            $userTask = new UsersTasks();
            $userTask->setUser($user);
            $userTask->setTasks($task);

            $em->persist($task);
            $em->persist($userTask);
            $em->flush();

            return $this->json([
                'message' => 'Tâche créée avec succès',
                'task' => [
                    'id' => $task->getId(),
                    'name' => $task->getName(),
                    'description' => $task->getDescription(),
                    'dueDate' => $task->getDueDate()?->format(DATE_ATOM),
                    'isArchived' => $task->isArchived(),
                    // Retourne le statut créé/assigné pour synchroniser le frontend
                    'status' => $task->getStatus() ? [
                        'id' => $task->getStatus()->getId(),
                        'label' => $task->getStatus()->getLabel(),
                    ] : null,
                    'category' => $task->getCategory() ? [
                        'id' => $task->getCategory()->getId(),
                        'label' => $task->getCategory()->getLabel(),
                        'color' => $task->getCategory()->getColor(),
                    ] : null,
                    'priority' => $task->getPriority() ? [
                        'id' => $task->getPriority()->getId(),
                        'label' => $task->getPriority()->getLabel(),
                    ] : null,
                ]
            ], 201);

        } catch (\Exception $e) {
            error_log("Error creating task: " . $e->getMessage());
            return $this->json([
                'error' => 'Erreur lors de la création de la tâche',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/api/tasks/{id}', name: 'tasks_update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_USER')]
    public function update(
        int $id,
        Request $request,
        TasksRepository $tasksRepository,
        UsersTasksRepository $usersTasksRepository,
        TaskCategoryRepository $taskCategoryRepository,
        TaskPriorityRepository $taskPriorityRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        try {
            $user = $this->getUser();
            
            if (!$user) {
                return $this->json(['error' => 'Utilisateur non authentifié'], 401);
            }

            // Récupérer la tâche
            $task = $tasksRepository->find($id);

            if (!$task) {
                return $this->json(['error' => 'Tâche non trouvée'], 404);
            }

            // Vérifier que la tâche appartient à l'utilisateur
            $userTask = $usersTasksRepository->findOneBy([
                'tasks' => $task,
                'user' => $user
            ]);

            if (!$userTask) {
                return $this->json(['error' => 'Accès refusé à cette tâche'], 403);
            }

            // Sauvegarder les anciennes valeurs pour l'historique
            $oldValues = [
                'name' => $task->getName(),
                'description' => $task->getDescription(),
                'dueDate' => $task->getDueDate()?->format(DATE_ATOM),
                'isArchived' => $task->isArchived(),
            ];

            // Mettre à jour les champs
            $data = json_decode($request->getContent(), true);
            $changes = [];

            if (isset($data['name']) && !empty(trim($data['name']))) {
                $newName = trim($data['name']);
                if ($newName !== $task->getName()) {
                    $changes['name'] = [
                        'old' => $task->getName(),
                        'new' => $newName
                    ];
                    $task->setName($newName);
                }
            }

            if (isset($data['description'])) {
                $newDescription = $data['description'];
                if ($newDescription !== $task->getDescription()) {
                    $changes['description'] = [
                        'old' => $task->getDescription(),
                        'new' => $newDescription
                    ];
                    $task->setDescription($newDescription);
                }
            }

            if (isset($data['isArchived'])) {
                $newIsArchived = (bool) $data['isArchived'];
                if ($newIsArchived !== $task->isArchived()) {
                    $changes['isArchived'] = [
                        'old' => $task->isArchived(),
                        'new' => $newIsArchived
                    ];
                    $task->setIsArchived($newIsArchived);
                }
            }

            if (isset($data['dueDate'])) {
                if (!empty($data['dueDate'])) {
                    try {
                        $dueDate = new \DateTime($data['dueDate']);
                        $oldDueDate = $task->getDueDate()?->format(DATE_ATOM);
                        $newDueDate = $dueDate->format(DATE_ATOM);
                        
                        if ($oldDueDate !== $newDueDate) {
                            $changes['dueDate'] = [
                                'old' => $oldDueDate,
                                'new' => $newDueDate
                            ];
                            $task->setDueDate($dueDate);
                        }
                    } catch (\Exception $e) {
                        return $this->json(['error' => 'Format de date invalide'], 400);
                    }
                } else {
                    if ($task->getDueDate() !== null) {
                        $changes['dueDate'] = [
                            'old' => $task->getDueDate()->format(DATE_ATOM),
                            'new' => null
                        ];
                        $task->setDueDate(null);
                    }
                }
            }

            // Gérer la catégorie
            if (isset($data['categoryId'])) {
                $oldCategoryId = $task->getCategory()?->getId();
                $newCategoryId = $data['categoryId'] ? (int)$data['categoryId'] : null;
                
                if ($oldCategoryId !== $newCategoryId) {
                    if ($newCategoryId) {
                        $category = $taskCategoryRepository->find($newCategoryId);
                        if ($category) {
                            $changes['category'] = [
                                'old' => $oldCategoryId,
                                'new' => $newCategoryId
                            ];
                            $task->setCategory($category);
                        }
                    } else {
                        $changes['category'] = [
                            'old' => $oldCategoryId,
                            'new' => null
                        ];
                        $task->setCategory(null);
                    }
                }
            }

            // Gérer la priorité
            if (isset($data['priorityId'])) {
                $oldPriorityId = $task->getPriority()?->getId();
                $newPriorityId = $data['priorityId'] ? (int)$data['priorityId'] : null;
                
                if ($oldPriorityId !== $newPriorityId) {
                    if ($newPriorityId) {
                        $priority = $taskPriorityRepository->find($newPriorityId);
                        if ($priority) {
                            $changes['priority'] = [
                                'old' => $oldPriorityId,
                                'new' => $newPriorityId
                            ];
                            $task->setPriority($priority);
                        }
                    } else {
                        $changes['priority'] = [
                            'old' => $oldPriorityId,
                            'new' => null
                        ];
                        $task->setPriority(null);
                    }
                }
            }

            // Créer un enregistrement dans l'historique si des changements ont été effectués
            if (!empty($changes)) {
                $taskHistory = new TaskHistory();
                $taskHistory->setTaskId($task);
                $taskHistory->setEditDate(new \DateTime());
                $taskHistory->setEditChanges($changes);
                
                $em->persist($taskHistory);
                
                error_log("Task history created for task #" . $task->getId() . " with changes: " . json_encode($changes));
            }

            $em->flush();

            return $this->json([
                'message' => 'Tâche mise à jour avec succès',
                'task' => [
                    'id' => $task->getId(),
                    'name' => $task->getName(),
                    'description' => $task->getDescription(),
                    'dueDate' => $task->getDueDate()?->format(DATE_ATOM),
                    'isArchived' => $task->isArchived(),
                    // Retourne le statut courant après mise à jour
                    'status' => $task->getStatus() ? [
                        'id' => $task->getStatus()->getId(),
                        'label' => $task->getStatus()->getLabel(),
                    ] : null,
                    'category' => $task->getCategory() ? [
                        'id' => $task->getCategory()->getId(),
                        'label' => $task->getCategory()->getLabel(),
                        'color' => $task->getCategory()->getColor(),
                    ] : null,
                    'priority' => $task->getPriority() ? [
                        'id' => $task->getPriority()->getId(),
                        'label' => $task->getPriority()->getLabel(),
                    ] : null,
                ],
                'changes' => $changes
            ]);

        } catch (\Exception $e) {
            error_log("Error updating task: " . $e->getMessage());
            return $this->json([
                'error' => 'Erreur lors de la mise à jour de la tâche',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/api/tasks/{id}', name: 'tasks_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(
        int $id,
        TasksRepository $tasksRepository,
        UsersTasksRepository $usersTasksRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        try {
            $user = $this->getUser();
            
            if (!$user) {
                return $this->json(['error' => 'Utilisateur non authentifié'], 401);
            }

            // Récupérer la tâche
            $task = $tasksRepository->find($id);

            if (!$task) {
                return $this->json(['error' => 'Tâche non trouvée'], 404);
            }

            // Vérifier que la tâche appartient à l'utilisateur
            $userTask = $usersTasksRepository->findOneBy([
                'tasks' => $task,
                'user' => $user
            ]);

            if (!$userTask) {
                return $this->json(['error' => 'Accès refusé à cette tâche'], 403);
            }

            // Archiver la tâche (elle ne sera plus visible pour l'utilisateur)
            $task->setIsArchived(true);
            
            // Créer un enregistrement dans l'historique
            $taskHistory = new TaskHistory();
            $taskHistory->setTaskId($task);
            $taskHistory->setEditDate(new \DateTime());
            $taskHistory->setEditChanges([
                'action' => 'archived_by_user',
                'user_email' => $user->getEmail(),
                'isArchived' => [
                    'old' => false,
                    'new' => true
                ]
            ]);
            
            $em->persist($taskHistory);
            $em->flush();

            return $this->json([
                'message' => 'Tâche archivée avec succès'
            ]);

        } catch (\Exception $e) {
            error_log("Error archiving task: " . $e->getMessage());
            return $this->json([
                'error' => 'Erreur lors de l\'archivage de la tâche',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Archiver/Désarchiver une tâche (Admin)
    #[Route('/api/admin/tasks/{id}/toggle-archive', name: 'task_toggle_archive', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function toggleArchive(
        int $id,
        TasksRepository $tasksRepository,
        EntityManagerInterface $em,
        TaskHistoryRepository $taskHistoryRepository
    ): JsonResponse {
        try {
            $task = $tasksRepository->find($id);

            if (!$task) {
                return $this->json(['error' => 'Tâche non trouvée'], 404);
            }

            $oldValue = $task->isArchived();
            $newValue = !$oldValue;
            
            $task->setIsArchived($newValue);

            // Créer une entrée dans l'historique
            $taskHistory = new TaskHistory();
            $taskHistory->setTaskId($task);
            $taskHistory->setEditDate(new \DateTime());
            $taskHistory->setEditChanges([
                'isArchived' => [
                    'old' => $oldValue,
                    'new' => $newValue
                ]
            ]);
            
            $em->persist($taskHistory);
            $em->flush();

            return $this->json([
                'message' => $newValue ? 'Tâche archivée avec succès' : 'Tâche désarchivée avec succès',
                'isArchived' => $newValue
            ]);

        } catch (\Exception $e) {
            error_log("Error toggling archive status: " . $e->getMessage());
            return $this->json([
                'error' => 'Erreur lors du changement de statut',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Récupérer l'historique d'une tâche (Admin)
    #[Route('/api/admin/tasks/{id}/history', name: 'task_history', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function getHistory(
        int $id,
        TasksRepository $tasksRepository,
        TaskHistoryRepository $taskHistoryRepository
    ): JsonResponse {
        $task = $tasksRepository->find($id);

        if (!$task) {
            return $this->json(['error' => 'Tâche non trouvée'], 404);
        }

        $historyEntries = $taskHistoryRepository->findBy(
            ['taskId' => $task],
            ['editDate' => 'DESC']
        );

        $data = array_map(static function (TaskHistory $history): array {
            return [
                'id' => $history->getId(),
                'changedAt' => $history->getEditDate()?->format(DATE_ATOM),
                'changes' => $history->getEditChanges(),
            ];
        }, $historyEntries);

        return $this->json($data);
    }

    // Rechercher des tâches (Admin)
    #[Route('/api/admin/tasks/search', name: 'tasks_search', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function search(Request $request, TasksRepository $tasksRepository): JsonResponse
    {
        $query = $request->query->get('q', '');
        
        if (empty(trim($query))) {
            return $this->json([]);
        }

        // Recherche dans la base de données
        $tasks = $tasksRepository->createQueryBuilder('t')
            ->leftJoin('t.usersTasks', 'ut')
            ->leftJoin('ut.user', 'u')
            ->leftJoin('t.category', 'c')
            ->leftJoin('t.priority', 'p')
            ->leftJoin('t.status', 's')
            ->where('t.name LIKE :query')
            ->orWhere('t.description LIKE :query')
            ->orWhere('u.pseudo LIKE :query')
            ->orWhere('u.Email LIKE :query')
            ->setParameter('query', '%' . $query . '%')
            ->orderBy('t.id', 'DESC')
            ->setMaxResults(50)
            ->getQuery()
            ->getResult();

        $data = array_map(static function (TaskEntity $task): array {
            $usersTasks = $task->getUsersTasks();
            $user = $usersTasks?->getUser();
            
            return [
                'id' => $task->getId(),
                'name' => $task->getName(),
                'description' => $task->getDescription(),
                'dueDate' => $task->getDueDate()?->format(DATE_ATOM),
                'isArchived' => $task->isArchived(),
                'user' => $user ? [
                    'id' => $user->getId(),
                    'pseudo' => $user->getPseudo(),
                    'email' => $user->getEmail(),
                ] : null,
                'category' => $task->getCategory() ? [
                    'id' => $task->getCategory()->getId(),
                    'label' => $task->getCategory()->getLabel(),
                    'color' => $task->getCategory()->getColor(),
                ] : null,
                'priority' => $task->getPriority() ? [
                    'id' => $task->getPriority()->getId(),
                    'label' => $task->getPriority()->getLabel(),
                ] : null,
                'status' => $task->getStatus() ? [
                    'id' => $task->getStatus()->getId(),
                    'label' => $task->getStatus()->getLabel(),
                ] : null,
            ];
        }, $tasks);

        return $this->json($data);
    }

    #[Route('/api/admin/task/{id}', name: 'task_delete_admin', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deleteAdmin(
        int $id,
        TasksRepository $tasksRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        try {
            $task = $tasksRepository->find($id);

            if (!$task) {
                return $this->json(['error' => 'Tâche non trouvée'], 404);
            }

            $em->remove($task);
            $em->flush();

            return $this->json([
                'message' => 'Tâche supprimée définitivement (admin)'
            ]);

        } catch (\Exception $e) {
            error_log("Erreur suppression définitive tâche: " . $e->getMessage());
            return $this->json([
                'error' => 'Erreur lors de la suppression définitive de la tâche',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/api/tasks/{id}', name: 'tasks_get', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function get(
        int $id,
        TasksRepository $tasksRepository,
        UsersTasksRepository $usersTasksRepository
    ): JsonResponse {
        try {
            $user = $this->getUser();
            
            if (!$user) {
                return $this->json(['error' => 'Utilisateur non authentifié'], 401);
            }

            // Récupérer la tâche
            $task = $tasksRepository->find($id);

            if (!$task) {
                return $this->json(['error' => 'Tâche non trouvée'], 404);
            }

            // Vérifier que la tâche appartient à l'utilisateur
            $userTask = $usersTasksRepository->findOneBy([
                'tasks' => $task,
                'user' => $user
            ]);

            if (!$userTask) {
                return $this->json(['error' => 'Accès refusé à cette tâche'], 403);
            }

            return $this->json([
                'id' => $task->getId(),
                'name' => $task->getName(),
                'description' => $task->getDescription(),
                'dueDate' => $task->getDueDate()?->format(DATE_ATOM),
                'isArchived' => $task->isArchived(),
                // Expose les infos complètes (dont statut) pour l'écran détail utilisateur
                'status' => $task->getStatus() ? [
                    'id' => $task->getStatus()->getId(),
                    'label' => $task->getStatus()->getLabel(),
                ] : null,
                'category' => $task->getCategory() ? [
                    'id' => $task->getCategory()->getId(),
                    'label' => $task->getCategory()->getLabel(),
                    'color' => $task->getCategory()->getColor(),
                ] : null,
                'priority' => $task->getPriority() ? [
                    'id' => $task->getPriority()->getId(),
                    'label' => $task->getPriority()->getLabel(),
                ] : null,
            ]);

        } catch (\Exception $e) {
            error_log("Error fetching task: " . $e->getMessage());
            return $this->json([
                'error' => 'Erreur lors de la récupération de la tâche',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
