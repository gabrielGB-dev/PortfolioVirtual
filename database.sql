CREATE DATABASE IF NOT EXISTS portfolio_senai
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE portfolio_senai;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS materias;
DROP TABLE IF EXISTS eixos;
DROP TABLE IF EXISTS estudantes;
DROP TABLE IF EXISTS professores;
DROP TABLE IF EXISTS admins;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE professores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE estudantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE eixos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icone VARCHAR(20) NULL,
  ordem INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE materias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  eixo_id INT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_materia_eixo_slug (eixo_id, slug),
  CONSTRAINT fk_materias_eixo
    FOREIGN KEY (eixo_id) REFERENCES eixos(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO eixos (nome, slug, icone, ordem) VALUES
('Linguagens', 'linguagens', '📚', 1),
('Humanas', 'humanas', '🌍', 2),
('Matemática', 'matematica', '📐', 3),
('Natureza', 'natureza', '🔬', 4),
('SENAI', 'senai', '💻', 5);

INSERT INTO materias (eixo_id, nome, slug, ordem) VALUES
((SELECT id FROM eixos WHERE slug='linguagens'), 'Linguagens e suas Tecnologias', 'linguagens-tecnologias', 1),
((SELECT id FROM eixos WHERE slug='humanas'), 'Ciências Humanas e Sociais Aplicadas', 'humanas-sociais', 1),
((SELECT id FROM eixos WHERE slug='matematica'), 'Matemática e suas Tecnologias', 'matematica-tecnologias', 1),
((SELECT id FROM eixos WHERE slug='natureza'), 'Ciências da Natureza e suas Tecnologias', 'natureza-tecnologias', 1),
((SELECT id FROM eixos WHERE slug='senai'), 'Técnico em Informática para a Internet', 'tecnico-informatica', 1);
