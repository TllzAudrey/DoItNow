<?php

namespace App\Entity;

use App\Repository\UsersRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UsersRepository::class)]
class Users implements UserInterface, PasswordAuthenticatedUserInterface
{
    public function setRoles(array $roles): static
    {
        if (in_array('ROLE_ADMIN', $roles, true)) {
            $this->role = 1;
        } else {
            $this->role = 0;
        }
        return $this;
    }
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 16)]
    private ?string $pseudo = null;

    #[ORM\Column(length: 64)]
    private ?string $Email = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $password = null;

    #[ORM\Column(type: Types::SMALLINT)]
    private ?int $role = null;

    /**
     * @var Collection<int, UsersTasks>
     */
    #[ORM\OneToMany(targetEntity: UsersTasks::class, mappedBy: 'user', orphanRemoval: true)]
    private Collection $usersTasks;

    public function __construct()
    {
        $this->usersTasks = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPseudo(): ?string
    {
        return $this->pseudo;
    }

    public function setPseudo(string $pseudo): static
    {
        $this->pseudo = $pseudo;

        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->Email;
    }

    public function setEmail(string $Email): static
    {
        $this->Email = $Email;

        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function setRole(int $role): static
    {
        $this->role = $role;

        return $this;
    }

    /**
     * Retourne les rôles de l'utilisateur sous forme de tableau
     * Convertit le champ role (int) en rôles Symfony
     * 
     * @return string[]
     */
    public function getRoles(): array
    {
        $roles = ['ROLE_USER'];
        
        if ($this->role === 1) {
            $roles[] = 'ROLE_ADMIN';
        }
        
        return array_unique($roles);
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->Email;
    }

    /** Obligatoire sinon Symfony fait son caca nerveux, pas vrai Grégoire ? */
    public function eraseCredentials(): void
    {
    }

    /**
     * @return Collection<int, UsersTasks>
     */
    public function getUsersTasks(): Collection
    {
        return $this->usersTasks;
    }

    public function addUsersTask(UsersTasks $usersTask): static
    {
        if (!$this->usersTasks->contains($usersTask)) {
            $this->usersTasks->add($usersTask);
            $usersTask->setUser($this);
        }

        return $this;
    }

    public function removeUsersTask(UsersTasks $usersTask): static
    {
        if ($this->usersTasks->removeElement($usersTask)) {
            // set the owning side to null (unless already changed)
            if ($usersTask->getUser() === $this) {
                $usersTask->setUser(null);
            }
        }

        return $this;
    }
}
