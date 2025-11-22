<?php

namespace App\Entity;

use App\Repository\UsersTasksRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UsersTasksRepository::class)]
class UsersTasks
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'usersTasks')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Users $user = null;

    #[ORM\OneToOne(inversedBy: 'usersTasks', cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: false)]
    private ?Tasks $tasks = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?Users
    {
        return $this->user;
    }

    public function setUser(?Users $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getTasks(): ?Tasks
    {
        return $this->tasks;
    }

    public function setTasks(Tasks $tasks): static
    {
        $this->tasks = $tasks;

        return $this;
    }
}
