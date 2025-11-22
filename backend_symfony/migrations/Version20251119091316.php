<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251119091316 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE task_history (id INT AUTO_INCREMENT NOT NULL, task_id_id INT NOT NULL, edit_date DATETIME NOT NULL, edit_changes JSON NOT NULL COMMENT \'(DC2Type:json)\', INDEX IDX_385B5AA1B8E08577 (task_id_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE task_history ADD CONSTRAINT FK_385B5AA1B8E08577 FOREIGN KEY (task_id_id) REFERENCES tasks (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE task_history DROP FOREIGN KEY FK_385B5AA1B8E08577');
        $this->addSql('DROP TABLE task_history');
    }
}
