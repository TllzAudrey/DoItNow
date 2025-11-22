<?php

namespace App\Entity;

use App\Repository\TasksRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TasksRepository::class)]
class Tasks
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 64)]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\ManyToOne(inversedBy: 'tasks')]
    #[ORM\JoinColumn(nullable: false)]
    private ?TaskStatus $status = null;

    #[ORM\ManyToOne(inversedBy: 'tasks')]
    private ?TaskCategory $category = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTime $dueDate = null;

    #[ORM\ManyToOne(inversedBy: 'tasks')]
    private ?TaskPriority $priority = null;

    #[ORM\OneToOne(mappedBy: 'tasks', cascade: ['persist', 'remove'])]
    private ?UsersTasks $usersTasks = null;

    /**
     * @var Collection<int, TaskHistory>
     */
    #[ORM\OneToMany(targetEntity: TaskHistory::class, mappedBy: 'taskId', orphanRemoval: true)]
    private Collection $taskHistories;

    #[ORM\Column]
    private ?bool $isArchived = null;

    public function __construct()
    {
        $this->taskHistories = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getStatus(): ?TaskStatus
    {
        return $this->status;
    }

    public function setStatus(?TaskStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getCategory(): ?TaskCategory
    {
        return $this->category;
    }

    public function setCategory(?TaskCategory $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getDueDate(): ?\DateTime
    {
        return $this->dueDate;
    }

    public function setDueDate(?\DateTime $dueDate): static
    {
        $this->dueDate = $dueDate;

        return $this;
    }

    public function getPriority(): ?TaskPriority
    {
        return $this->priority;
    }

    public function setPriority(?TaskPriority $priority): static
    {
        $this->priority = $priority;

        return $this;
    }

    public function getUsersTasks(): ?UsersTasks
    {
        return $this->usersTasks;
    }

    public function setUsersTasks(UsersTasks $usersTasks): static
    {
        // set the owning side of the relation if necessary
        if ($usersTasks->getTasks() !== $this) {
            $usersTasks->setTasks($this);
        }

        $this->usersTasks = $usersTasks;

        return $this;
    }

    /**
     * @return Collection<int, TaskHistory>
     */
    public function getTaskHistories(): Collection
    {
        return $this->taskHistories;
    }

    public function addTaskHistory(TaskHistory $taskHistory): static
    {
        if (!$this->taskHistories->contains($taskHistory)) {
            $this->taskHistories->add($taskHistory);
            $taskHistory->setTaskId($this);
        }

        return $this;
    }

    public function removeTaskHistory(TaskHistory $taskHistory): static
    {
        if ($this->taskHistories->removeElement($taskHistory)) {
            // set the owning side to null (unless already changed)
            if ($taskHistory->getTaskId() === $this) {
                $taskHistory->setTaskId(null);
            }
        }

        return $this;
    }

    public function isArchived(): ?bool
    {
        return $this->isArchived;
    }

    public function setIsArchived(bool $isArchived): static
    {
        $this->isArchived = $isArchived;

        return $this;
    }
}
