<?php

namespace App\Entity;

use App\Repository\TaskHistoryRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TaskHistoryRepository::class)]
class TaskHistory
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'taskHistories')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Tasks $taskId = null;

    #[ORM\Column]
    private ?\DateTime $editDate = null;

    #[ORM\Column]
    private array $editChanges = [];

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTaskId(): ?Tasks
    {
        return $this->taskId;
    }

    public function setTaskId(?Tasks $taskId): static
    {
        $this->taskId = $taskId;

        return $this;
    }

    public function getEditDate(): ?\DateTime
    {
        return $this->editDate;
    }

    public function setEditDate(\DateTime $editDate): static
    {
        $this->editDate = $editDate;

        return $this;
    }

    public function getEditChanges(): array
    {
        return $this->editChanges;
    }

    public function setEditChanges(array $editChanges): static
    {
        $this->editChanges = $editChanges;

        return $this;
    }
}
