<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251114160432 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE users_tasks (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, tasks_id INT NOT NULL, INDEX IDX_B72FC1DEA76ED395 (user_id), UNIQUE INDEX UNIQ_B72FC1DEE3272D31 (tasks_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE users_tasks ADD CONSTRAINT FK_B72FC1DEA76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE users_tasks ADD CONSTRAINT FK_B72FC1DEE3272D31 FOREIGN KEY (tasks_id) REFERENCES tasks (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE users_tasks DROP FOREIGN KEY FK_B72FC1DEA76ED395');
        $this->addSql('ALTER TABLE users_tasks DROP FOREIGN KEY FK_B72FC1DEE3272D31');
        $this->addSql('DROP TABLE users_tasks');
    }
}
