<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251114155237 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE tasks (id INT AUTO_INCREMENT NOT NULL, status_id INT NOT NULL, category_id INT DEFAULT NULL, priority_id INT DEFAULT NULL, name VARCHAR(64) NOT NULL, description LONGTEXT DEFAULT NULL, due_date DATETIME DEFAULT NULL, INDEX IDX_505865976BF700BD (status_id), INDEX IDX_5058659712469DE2 (category_id), INDEX IDX_50586597497B19F9 (priority_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE tasks ADD CONSTRAINT FK_505865976BF700BD FOREIGN KEY (status_id) REFERENCES task_status (id)');
        $this->addSql('ALTER TABLE tasks ADD CONSTRAINT FK_5058659712469DE2 FOREIGN KEY (category_id) REFERENCES task_category (id)');
        $this->addSql('ALTER TABLE tasks ADD CONSTRAINT FK_50586597497B19F9 FOREIGN KEY (priority_id) REFERENCES task_priority (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE tasks DROP FOREIGN KEY FK_505865976BF700BD');
        $this->addSql('ALTER TABLE tasks DROP FOREIGN KEY FK_5058659712469DE2');
        $this->addSql('ALTER TABLE tasks DROP FOREIGN KEY FK_50586597497B19F9');
        $this->addSql('DROP TABLE tasks');
    }
}
