-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : ven. 20 fév. 2026 à 19:35
-- Version du serveur : 11.3.2-MariaDB
-- Version de PHP : 8.2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `doitnow`
--

-- --------------------------------------------------------

--
-- Structure de la table `doctrine_migration_versions`
--

DROP TABLE IF EXISTS `doctrine_migration_versions`;
CREATE TABLE IF NOT EXISTS `doctrine_migration_versions` (
  `version` varchar(191) NOT NULL,
  `executed_at` datetime DEFAULT NULL,
  `execution_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Déchargement des données de la table `doctrine_migration_versions`
--

INSERT INTO `doctrine_migration_versions` (`version`, `executed_at`, `execution_time`) VALUES
('DoctrineMigrations\\Version20251114150406', '2025-11-19 09:09:19', 68),
('DoctrineMigrations\\Version20251114151517', '2025-11-19 09:09:19', 42),
('DoctrineMigrations\\Version20251114155237', '2025-11-19 09:09:19', 103),
('DoctrineMigrations\\Version20251114160432', '2025-11-19 09:09:19', 81),
('DoctrineMigrations\\Version20251119091316', '2025-11-19 11:48:10', 354),
('DoctrineMigrations\\Version20251119091414', '2025-11-19 11:48:10', 138);

-- --------------------------------------------------------

--
-- Structure de la table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `priority_id` int(11) DEFAULT NULL,
  `name` varchar(64) NOT NULL,
  `description` longtext DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_505865976BF700BD` (`status_id`),
  KEY `IDX_5058659712469DE2` (`category_id`),
  KEY `IDX_50586597497B19F9` (`priority_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `task_category`
--

DROP TABLE IF EXISTS `task_category`;
CREATE TABLE IF NOT EXISTS `task_category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(32) NOT NULL,
  `color` varchar(7) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `task_category`
--

INSERT INTO `task_category` (`id`, `label`, `color`) VALUES
(8, 'catégorie 1', '#5a6268');

-- --------------------------------------------------------

--
-- Structure de la table `task_history`
--

DROP TABLE IF EXISTS `task_history`;
CREATE TABLE IF NOT EXISTS `task_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id_id` int(11) NOT NULL,
  `edit_date` datetime NOT NULL,
  `edit_changes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '(DC2Type:json)' CHECK (json_valid(`edit_changes`)),
  PRIMARY KEY (`id`),
  KEY `IDX_385B5AA1B8E08577` (`task_id_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `task_priority`
--

DROP TABLE IF EXISTS `task_priority`;
CREATE TABLE IF NOT EXISTS `task_priority` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(16) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `task_status`
--

DROP TABLE IF EXISTS `task_status`;
CREATE TABLE IF NOT EXISTS `task_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `task_status`
--

INSERT INTO `task_status` (`id`, `label`) VALUES
(1, 'en cours');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pseudo` varchar(16) NOT NULL,
  `email` varchar(64) NOT NULL,
  `password` longtext NOT NULL,
  `role` smallint(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `pseudo`, `email`, `password`, `role`) VALUES
(3, 'test', 'audrey@gmail.com', '$2y$13$FdILoQn8a33iGKf3Fb0TWulUtOb8mxykdSp/bKJkfmU42Vo2qsiu6', 1),
(4, 'TestSite', 'test@gmail.com', '$2y$13$KqZhskDljDmcW9BRvymF8OIuo91Pn59GvJrMKzVwWmiWH4SWwqM6S', 0);

-- --------------------------------------------------------

--
-- Structure de la table `users_tasks`
--

DROP TABLE IF EXISTS `users_tasks`;
CREATE TABLE IF NOT EXISTS `users_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `tasks_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_B72FC1DEE3272D31` (`tasks_id`),
  KEY `IDX_B72FC1DEA76ED395` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `FK_5058659712469DE2` FOREIGN KEY (`category_id`) REFERENCES `task_category` (`id`),
  ADD CONSTRAINT `FK_50586597497B19F9` FOREIGN KEY (`priority_id`) REFERENCES `task_priority` (`id`),
  ADD CONSTRAINT `FK_505865976BF700BD` FOREIGN KEY (`status_id`) REFERENCES `task_status` (`id`);

--
-- Contraintes pour la table `task_history`
--
ALTER TABLE `task_history`
  ADD CONSTRAINT `FK_385B5AA1B8E08577` FOREIGN KEY (`task_id_id`) REFERENCES `tasks` (`id`);

--
-- Contraintes pour la table `users_tasks`
--
ALTER TABLE `users_tasks`
  ADD CONSTRAINT `FK_B72FC1DEA76ED395` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `FK_B72FC1DEE3272D31` FOREIGN KEY (`tasks_id`) REFERENCES `tasks` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
