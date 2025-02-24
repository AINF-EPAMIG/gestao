-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Tempo de geração: 24/02/2025 às 12:27
-- Versão do servidor: 10.11.10-MariaDB
-- Versão do PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `u711845530_gestao`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `atividades`
--

CREATE TABLE `atividades` (
  `id` int(11) NOT NULL,
  `data_criacao` date DEFAULT NULL,
  `projeto_id` int(11) DEFAULT NULL,
  `titulo` varchar(200) NOT NULL,
  `descricao` text DEFAULT NULL,
  `prioridade_id` int(11) DEFAULT NULL,
  `status_id` int(11) DEFAULT NULL,
  `estimativa_horas` decimal(10,2) DEFAULT NULL,
  `data_inicio` date DEFAULT NULL,
  `data_fim` date DEFAULT NULL,
  `data_conclusao` date DEFAULT NULL,
  `id_release` varchar(50) DEFAULT NULL,
  `position` int(11) DEFAULT NULL,
  `ultima_atualizacao` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `setor_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `atividades`
--

INSERT INTO `atividades` (`id`, `data_criacao`, `projeto_id`, `titulo`, `descricao`, `prioridade_id`, `status_id`, `estimativa_horas`, `data_inicio`, `data_fim`, `data_conclusao`, `id_release`, `position`, `ultima_atualizacao`, `setor_id`) VALUES
(1, '2024-11-01', 1, 'Remoção do nome da colaboradora', 'A pedido, remover o nome da colaboradora Cecileny da lista de aniversariantes', 2, 4, 1.00, '2024-11-01', '2024-11-01', '2024-11-01', NULL, 1, NULL, 1),
(2, '2024-11-01', 2, 'Automatizar Relatórios da Plataforma de Pesquisa', 'Hoje os anos são fixos, e precisam ser dinâmicos Disponibilizado para a Regina validar no dia 06/11/2024', 2, 4, 2.00, '2024-11-06', '2024-11-06', '2024-11-06', NULL, 2, NULL, 1),
(3, '2024-11-01', 3, 'Criação do PDF do Relatório de Estágio I II III', 'Modelo criado e enviado por e-mail para aprovação do RH.', 2, 3, NULL, NULL, NULL, NULL, NULL, 3, NULL, 1),
(4, '2024-11-01', 4, 'Conversas Iniciais com a comissão do evento', 'Site / Gestão dos Participantes. O site esta sendo criado pelo Alex e o sistema por mim', 2, 2, NULL, NULL, NULL, NULL, NULL, 4, NULL, 1),
(5, '2024-11-01', 5, 'Desenvolvimento do aplicativo', 'Thiago Ladeira disponibilizou na play store, aguardando aprovação', 3, 4, NULL, NULL, NULL, NULL, NULL, 5, NULL, 1),
(6, '2024-11-01', 6, 'Nova Ouvidoria da EPAMIG', 'Enviado para validação da Auditoria', 2, 3, NULL, NULL, NULL, NULL, NULL, 6, NULL, 1),
(7, '2024-11-01', 7, 'Atualização do Formulário de Metas Físicas', 'A pedido da Iara, atualizar o formulário na parte das Metas Físicas', 2, 4, 10.00, NULL, NULL, NULL, NULL, 7, NULL, 1),
(8, '2024-11-01', 8, 'Verificar comunicação TOTVS X API', 'Pegar documentação com o Felipe a respeito dessa integração', 2, 4, 8.00, '2024-11-05', '2024-11-05', '2024-11-05', NULL, 8, NULL, 1),
(9, '2024-11-01', 9, 'Reunião com DVLP - Levantamento de Requisitos', 'Reunião com o Thiago/DVLP - 04/11/2024 para entender a necessidade do setor, o Igor irá nos auxiliar com a listagem dos produtos', 3, 2, NULL, NULL, NULL, NULL, NULL, 9, NULL, 1),
(10, '2024-11-01', 5, 'Gravar vídeo do uso do APP', 'Enviado para Michele.', 3, 4, 2.00, '2024-11-05', '2024-11-05', '2024-11-05', NULL, 10, NULL, 1),
(11, '2024-11-01', 9, 'Migração da tabela de Produtos', 'Tabela migrada com ajuda do colaborador Igor', 2, 4, 1.00, '2024-11-05', '2024-11-05', '2024-11-05', NULL, 11, NULL, 1),
(12, '2024-11-01', 9, 'Desenvolvimento do formulário de Disponibilização', NULL, 3, 4, 3.00, '2024-11-05', '2024-11-05', '2024-11-05', NULL, 12, NULL, 1),
(13, '2024-11-01', 9, 'Funcionalidade de Aprovação da unidade de origem', NULL, 3, 4, 3.00, '2024-11-06', '2024-11-06', '2024-11-06', NULL, 13, NULL, 1),
(14, '2024-11-01', 9, 'Adicionar o campo observação no formulário de Disponibilização', NULL, 2, 4, 1.00, '2024-11-07', '2024-11-07', '2024-11-11', '12', 14, NULL, 1),
(15, '2024-11-01', 9, 'Desenvolvimento do Formulário de Inservíveis', NULL, 3, 3, 3.00, '2024-11-07', '2024-11-07', NULL, NULL, 15, NULL, 1),
(16, '2024-11-01', 10, 'Aplicação para inserção e controle de reservas da sala de multimeios e auditório', 'Desenvolver aplicação que realize todo o controle de reservas do auditório e sala de multimeios', 1, 4, NULL, '2024-11-11', NULL, NULL, NULL, 16, NULL, 1),
(17, '2024-11-01', 10, 'Manual para realização de reserva', 'Criar documento em PDF com o passo a passo da realização do procedimento. Lembrando que deverá ter o 1 passo a passo para quem realiza a reserva, e 1 passo a passo para quem realiza o controle da reserva.', 1, 4, 4.00, '2024-12-03', '2024-12-04', '2024-12-05', NULL, 17, NULL, 1),
(18, '2024-11-01', 10, 'Vídeo de navegação da inclusão da reserva', 'Realizar vídeo mostrando desde a navegação do link (na intranet) até a realização da reserva. Disponibilizar o vídeo para Michelle realizar a apresentação para inclusão na Academia Epamig.', 1, 4, 1.00, '2024-12-06', '2024-12-06', '2024-12-06', NULL, 18, NULL, 1),
(19, '2024-11-01', 7, 'Documentação PDF SGI', 'Realizar documentação em PDF de todas as funcionalidades do SGI. Solicitar acesso e informações do Rodolfo sobre essa aplicação.', 1, 4, 16.00, '2024-11-12', '2024-11-18', '2024-11-18', NULL, 19, NULL, 1),
(20, '2024-11-01', 7, 'Vídeo de navegação SGI', 'Realizar vídeo mostrando desde a navegação do link (na intranet) até as inclusões do SGI. Disponibilizar o vídeo para Michelle realizar a apresentação para inclusão na Academia Epamig.', 1, 1, NULL, NULL, NULL, NULL, NULL, 20, NULL, 1),
(21, '2024-11-01', 5, 'Realizar vídeo navegação do app', 'Realizar vídeo navegação do app e disponibilizar para Michelle realizar o vídeo.', 2, 1, NULL, NULL, NULL, NULL, NULL, 21, NULL, 1),
(22, '2024-11-01', 8, 'Verificar integração do sistema Transparência com a API', 'Sistema hoje realiza a consulta manual no banco utilizando php, será verificado uma maneira de integração com a API em JAVA que realiza a consulta direta no TOTVS', 2, 4, 4.00, '2024-11-07', '2024-11-08', '2024-11-08', NULL, 22, NULL, 1),
(23, '2024-11-01', 8, 'Criação de SQL no TOTVS que realiza consulta semelhante ao transparência', 'Alteração da consulta existente feita pelo Felipe conforme necessidade', 2, 4, 1.00, '2024-11-07', '2024-11-07', '2024-11-07', NULL, 23, NULL, 1),
(24, '2024-11-01', 2, 'Ajustar Relatório da Plataforma de Pesquisa', 'Solicitação enviado para ajustes no dia 07/11/2024', 1, 4, 2.00, '2024-11-07', '2024-11-08', '2024-11-08', NULL, 24, NULL, 1),
(25, '2024-11-01', 7, 'Ajustar no SGI o cadastro de produtos', 'Exibir no SGI somente os produtos com que possuem o Flag ativado no cadastro \"enviar para SGI\" no rm totvs.', 2, 2, NULL, NULL, NULL, NULL, '12', 25, NULL, 1),
(26, '2024-11-01', 9, 'Adicionar o checklist no formulário de disponibilização', 'será adicionado um checklist e envio de fotos comprovando o estado de conservação do bem', 2, 4, 5.00, '2024-11-07', '2024-11-07', '2024-11-11', NULL, 26, NULL, 1),
(27, '2024-11-01', 2, 'Desenvolvimento do novo Formulário de Tecnologia', 'enviado por e-mail pela Cristiane, no dia 08/11/2024', 2, 3, 10.00, NULL, NULL, NULL, NULL, 27, NULL, 1),
(28, '2024-11-01', 2, 'Desenvolvimento de Relatórios de Tecnologia', 'enviado por e-mail pela Cristiane, no dia 08/11/2024', 2, 3, NULL, NULL, NULL, NULL, NULL, 28, NULL, 1),
(29, '2024-11-01', 8, 'Otimizar a pesquisa da consulta tranparência junto a API', 'Com o apoio do Felipe, dividir as consultas SQL, e então criar if else na API para dependendo da chapa informada, apontar para uma consulta específica na TOTVS', 2, 4, 2.00, '2024-11-11', '2024-11-12', NULL, NULL, 29, NULL, 1),
(30, '2024-11-01', 13, 'inclusão das chapas, é possível parametrizar para seja preenchida com 0 a esquerda, precisamos no total de 6 dígitos', NULL, 2, 4, 1.00, '2024-11-12', '2024-11-12', NULL, NULL, 30, NULL, 1),
(31, '2024-11-01', 4, 'Desenvolvimento do Site do Evento', NULL, 2, 2, NULL, '2024-11-18', NULL, NULL, NULL, 31, NULL, 1),
(32, '2024-11-01', 11, 'Documentação PDF do Sistema de Contratos', 'Criar um documento em PDF com passo a passo para utilização do sistema', 1, 4, 4.00, '2024-11-18', '2024-11-19', '2024-11-18', NULL, 32, NULL, 1),
(33, '2024-11-01', 12, 'Criação base de app e integração com banco', 'Criação do app com deploy no github, juntamente com integração com banco. Enquanto é aguardado a planilha com dados para importação', 1, 4, 2.00, '2024-11-19', '2024-11-19', '2024-11-19', NULL, 33, NULL, 1),
(34, '2024-11-01', 12, 'Protótipo com planilha inicial recebida', 'Criação de protótipo com a planilha exemplo recebida, exemplo de apresentação do germoplasma com filtros', 2, 4, 4.00, '2024-11-21', '2024-11-21', '2024-11-21', NULL, 34, NULL, 1),
(35, '2024-11-01', 12, 'Criação da tela e autenticação de login', 'Login para usuários que poderão realizar o cadastro de novos germoplasma no sistema', 2, 4, 4.00, '2024-11-27', '2024-11-28', '2024-11-29', NULL, 35, NULL, 1),
(36, '2024-11-01', 12, 'Alteração de layout', 'Melhorar o design da aplicação germoplasma web', 2, 4, 4.00, '2024-11-22', '2024-11-25', '2024-11-25', NULL, 36, NULL, 1),
(37, '2024-11-01', 10, 'Alterações Solicitadas na Reunião', 'Alterações solicitadas pelas secretárias responsavéis pela locação da multimeios e auditório', 1, 4, 8.00, '2024-11-25', '2024-11-28', NULL, NULL, 37, NULL, 1),
(38, '2024-11-01', 7, 'Automatização de rotinas no SGI', 'Gestão de Prazos para cadastrar,editar,excluir', 2, 2, NULL, NULL, NULL, NULL, NULL, 38, NULL, 1),
(39, '2024-11-01', 15, 'Super Rede de Plantas Medicinais', 'Demanda solicitada pela pesquisadora Juliana Oliveira, encaminhar primeiras versões para alinhamento', 2, 2, 8.00, '2025-01-06', '2025-01-10', '2025-01-10', NULL, 39, NULL, 1),
(40, '2024-11-01', 12, 'Criação de Layout conforme solicitação do Malta', 'Criação de layout conforme imagem de pdf compartilhado pelo Malta, além da planilha já entregue', 2, 4, 6.00, '2024-12-06', '2024-12-09', '2024-12-09', NULL, 40, NULL, 1),
(41, '2024-12-01', 5, 'Modelar Manual de Transporte', 'Modelar manual enviado pelo Thiago, para disponibilização na Academia EPAMIG', 3, 4, NULL, NULL, NULL, NULL, NULL, 41, NULL, 1),
(42, '2024-12-01', 5, 'Banner envio de email para o sistema de Frota de veículo', 'Criar um banner que tenha o link de acesso ao treinamento e falando sobre o novo sistema', 2, 4, 3.00, '2024-11-11', '2024-12-11', '2024-12-11', NULL, 42, NULL, 1),
(43, '2024-12-01', 5, 'Vídeo treinamento do sistema de frota', 'Criar o vídeo tutorial para controle de frota', 2, 4, 24.00, '2024-11-13', '2024-11-19', '2024-12-05', NULL, 43, NULL, 1),
(44, '2024-12-01', 10, 'Vídeo reserva multimeios/auditório', 'Criar vídeo tutorial com as instruções do sistema de reserva', 2, 3, 24.00, '2024-12-12', '2024-12-16', NULL, NULL, 44, NULL, 1),
(45, '2024-12-01', 10, 'Banner envio de email para o sistema de reserva', 'Criar um banner que tenha o link de acesso ao treinamento e falando sobre o novo modelo de reservas ao auditório e multimeios', 2, 4, 3.00, '2024-12-16', '2024-12-16', '2024-12-20', NULL, 45, NULL, 1),
(46, '2024-12-01', NULL, 'Onboard dos funcionários', 'Criação e reformulação das apresentações dos setores e assessorias: DPGP; DVOS; AINF; AUDI e ASGE.', 2, 4, 40.00, '2024-11-06', '2024-11-12', '2024-11-13', NULL, 46, NULL, 1),
(47, '2024-12-01', NULL, 'Organograma', 'Revitalização do Organograma', 2, 4, 12.00, '2024-10-31', '2024-11-04', '2025-02-17', NULL, 47, NULL, 1),
(48, '2024-12-01', NULL, 'Banner de envio de email para o projeto : Semeando Tecnologia, colhendo eficiência. E Reformulação do questionário do projeto', 'Criar um banner que tenha o link de acesso e falando sobre o formulário do projeto, além de reformular o questionário com o intuito de diminuir as abas de acesso e colocá-lo mais interativo para convencer o funcionário a responder.', 2, 4, 12.00, '2024-11-26', '2024-11-27', '2024-11-28', NULL, 48, NULL, 1),
(49, '2024-12-01', NULL, 'Banner envio de email para o sistema de balcão de trocas de mercadorias', 'Banner envio de email para o sistema de balcão de disponibilização de bens e mercadorias', 2, 4, 3.00, '2024-12-12', '2024-12-12', '2024-11-28', NULL, 49, NULL, 1),
(50, '2024-12-01', 17, 'Desenvolvimento da Consulta', 'Desenvolvimento de um formulario alternativo com a consulta mais otimizada! Buscando apenas os ultimos 24 meses da tabela principal', 3, 4, NULL, NULL, NULL, NULL, NULL, 50, NULL, 1),
(51, '2024-12-01', 15, 'Desenvolvimento do Cadastro das Plantas e layout externo para consulta', 'Auxiliando o Arthur no projeto: estrutura de banco, layout, consultas externas', 2, 3, NULL, NULL, NULL, NULL, NULL, 51, NULL, 1),
(52, '2024-12-01', 5, 'Atualização do Icone do App', 'Atualizei no dia 12/12 icone e correção no nome, proximo passo é play store', 3, 2, NULL, NULL, NULL, NULL, NULL, 52, NULL, 1),
(53, '2024-12-01', 2, 'Relatório de Captação', 'Relatório de captação para entregar hoje dia 17/12/2024', 3, 4, 3.00, '2024-12-17', '2024-12-17', NULL, NULL, 53, NULL, 1),
(54, '2024-12-01', 9, 'Criação do tutorial de acesso e uso do sistema', 'Desenvolver um tutorial de acesso e uso do sistema de balcão da EPAMIG', 2, 4, NULL, '2024-12-17', '2024-12-17', '2024-12-17', NULL, 54, NULL, 1),
(55, '2024-12-01', 9, 'Criação do video de acesso do sistema', 'Desenvolver um video tutorial de acesso e uso do sistema de balcão da EPAMIG', 2, 4, NULL, '2024-12-17', '2024-12-17', '2024-12-17', NULL, 55, NULL, 1),
(56, '2024-12-01', 8, 'Criar um pop tutorial de como abrir chamados', 'Desenvolver um tutorial de acesso e de como abrir um chamado para solicitar serviços de informática', 1, 4, NULL, '2024-12-17', '2024-12-17', '2024-12-17', NULL, 56, NULL, 1),
(57, '2024-12-01', 9, 'Narração pela Daphne para o video de disponibilização do sistema de Balcão da Epamig', 'Formular uma narração pela Daphne para o video de tutorial do sistema de balcão da EPAMIG', 1, 4, 36.00, '2025-02-04', '2025-02-07', NULL, NULL, 57, NULL, 1),
(58, '2024-12-01', 16, 'Criação do tutorial de acesso e uso do sistema', 'Desenvolver um tutorial de acesso e de como utilizar o sistema de CheckON', 3, 4, NULL, NULL, NULL, NULL, NULL, 58, NULL, 1),
(59, '2024-12-01', 5, 'Migração dos Relatórios TicketLog', 'MIgrar relatórios extraidos da ticketlog, criar tela para consultas', 2, 1, NULL, NULL, NULL, NULL, NULL, 59, NULL, 1),
(60, '2024-12-01', 12, 'Aplicativo Mobile', 'PWA do site criado, para gerar apk de instalação android', 2, 4, 4.00, '2024-12-30', '2024-12-30', '2024-12-30', NULL, 60, NULL, 1),
(61, '2024-12-01', 4, 'Inscrição', 'Formulário de Inscrição do Evento', 3, 3, NULL, '2025-01-06', NULL, NULL, NULL, 61, NULL, 1),
(62, '2025-01-01', 4, 'Inscrição dos Resumos', 'Formulário de Resumos', 3, 1, NULL, NULL, NULL, NULL, NULL, 62, NULL, 1),
(63, '2025-01-01', 2, 'Alteração no form de bolsistas, criação de relatórios', NULL, 2, 4, 16.00, '2024-01-27', '2024-01-29', NULL, NULL, 63, NULL, 1),
(64, '2025-01-01', 14, 'Alteração do layout que dispara para os funcionários da EPAMIG', NULL, 2, 4, 16.00, '2024-01-27', '2024-01-29', NULL, NULL, 64, NULL, 1),
(65, '2025-01-01', 2, 'Desenvolvimento de Relatórios Gerenciais', 'Desenvolver relatórios de monitoramento de atividades que estão em duplicidade', 3, 2, NULL, NULL, NULL, NULL, NULL, 65, NULL, 1),
(66, '2025-01-01', 7, 'Atualização dos relatórios gerenciais', 'Com a migração para a nuvem e com a comunicação com Tovs, esta sendo atualizado o formulário e relatórios', 3, 2, NULL, NULL, NULL, NULL, NULL, 66, NULL, 1),
(67, '2025-01-01', 10, 'Alteração solicitadas na reunião', 'Conforme solicitado na reunião foram feitas: Tirar do corpo Justificativa e inserir Descrição. Incluir a opção Coffebreak para todos Informe a quantidade de pessoas Incluir o que seria esse apoio nos campos', 1, 4, 12.00, '2025-02-03', '2025-02-06', '2025-02-07', NULL, 67, NULL, 1),
(68, '2025-02-01', 5, 'filtro na consulta só por unidade - sede veiculo localiza opção de finalizar asv formulário de multa ao selecionar asv aparecer o link da asv', 'filtro na consulta só por unidade - sede veiculo localiza opção de finalizar asv formulário de multa ao selecionar asv aparecer o link da asv', 2, 4, 8.00, '2025-02-10', '2025-02-11', NULL, NULL, 68, NULL, 1),
(69, '2025-02-01', NULL, 'Criação da rotina backup da vps', NULL, 3, 4, 16.00, '2025-02-11', '2025-02-13', NULL, NULL, 69, NULL, 1),
(70, '2025-02-01', 18, 'Desenvolvimento de um site formulário para o inventário de dados do LGPD', 'Sistema em desenvolvimento para atender o que foi acordado em comissão da LGPD', 2, 4, NULL, '2025-02-10', '2025-02-18', '2025-02-17', NULL, 70, NULL, 1),
(71, '2025-02-01', 19, 'Sistema de Gestão de Projetos com Kaban', 'Criação do sistema de kanban que utiliza da mesma ideia desta planilha, mas em outros formatos', 2, 3, 16.00, '2025-02-05', '2025-02-12', NULL, NULL, 71, NULL, 1),
(72, '2025-02-01', 2, 'Novo Formulário de Tecnologia,Criação da Aba Relatórios de Governança, Desenvolvimento do Relatório PEP', 'Novo Formulário de Tecnologia,Criação da Aba Relatórios de Governança, Desenvolvimento do Relatório PEP (Projetos em Execução),Monitoramento – Extrato de Atividades – Funcionalidade de exportação em PDF disponível.', 3, 3, NULL, '2025-02-10', '2025-02-10', NULL, NULL, 72, NULL, 1),
(73, '2025-02-01', 2, 'Desenvolvimento de Relatórios da Plataforma 2.0', 'no de pesquisadores / unidade , média da produtividade / unidade, no de pesquisadores com produtividade abaixo da média da produtividade da empresa , no de pesquisadores no extremo inferior da plataforma ( menos q 10% do maior valor de produtividade)', 3, 4, 16.00, '2024-02-12', '2024-02-14', NULL, NULL, 73, NULL, 1),
(74, '2025-02-01', 20, 'Criação do documento tutorial', 'Criação de um documento tutorial para acesso e uso do sistema de gestão de obras', 2, 1, NULL, NULL, NULL, NULL, NULL, 74, NULL, 1),
(75, '2025-02-01', 2, 'Relatório Pontuação Educacional', 'desenvolvimento de um relatório que mostra a pontuação nos indicadores de educação', 3, 3, NULL, '2025-02-15', NULL, NULL, NULL, 75, NULL, 1),
(76, '2025-02-01', 2, 'Migração de Atividades da Cristiane para o ano atual', NULL, 2, 4, 4.00, '2025-02-17', '2025-02-17', NULL, NULL, 76, NULL, 1),
(77, '2025-02-01', 5, 'Atualização da tabela de usuários', NULL, 2, 3, 8.00, '2025-02-17', NULL, NULL, NULL, 77, NULL, 1),
(83, '2025-02-20', NULL, 'teste', '', 2, 1, 0.00, '2025-02-20', '0000-00-00', NULL, NULL, NULL, NULL, 1),
(84, '2025-02-20', NULL, 'teste', '', 2, 1, 0.00, '2025-02-20', '0000-00-00', NULL, NULL, -1, '2025-02-23 13:11:43', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `atividades_responsaveis`
--

CREATE TABLE `atividades_responsaveis` (
  `atividade_id` int(11) NOT NULL,
  `responsavel_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `atividades_responsaveis`
--

INSERT INTO `atividades_responsaveis` (`atividade_id`, `responsavel_id`) VALUES
(1, 4),
(2, 4),
(3, 4),
(4, 4),
(5, 4),
(6, 4),
(7, 4),
(8, 3),
(9, 4),
(10, 4),
(11, 4),
(12, 4),
(13, 4),
(14, 4),
(15, 4),
(16, 6),
(17, 6),
(18, 6),
(19, 6),
(20, 6),
(21, 4),
(22, 3),
(23, 3),
(24, 4),
(25, 4),
(26, 4),
(27, 4),
(28, 4),
(29, 3),
(30, 4),
(31, 4),
(32, 6),
(33, 3),
(34, 3),
(35, 3),
(36, 3),
(37, 6),
(38, 4),
(39, 3),
(40, 3),
(41, 6),
(42, 5),
(43, 5),
(44, 5),
(45, 5),
(46, 5),
(47, 5),
(48, 5),
(49, 5),
(50, 4),
(51, 4),
(52, 4),
(53, 4),
(54, 6),
(55, 6),
(56, 6),
(57, 5),
(58, 6),
(59, 4),
(60, 3),
(61, 4),
(62, 4),
(63, 4),
(64, 4),
(65, 4),
(66, 4),
(67, 6),
(68, 4),
(69, 4),
(70, 6),
(71, 3),
(72, 4),
(73, 4),
(74, 6),
(75, 4),
(76, 4),
(77, 4),
(83, 3),
(83, 4),
(84, 3),
(84, 4);

-- --------------------------------------------------------

--
-- Estrutura para tabela `prioridades`
--

CREATE TABLE `prioridades` (
  `id` int(11) NOT NULL,
  `nome` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `prioridades`
--

INSERT INTO `prioridades` (`id`, `nome`) VALUES
(1, 'Baixa'),
(2, 'Média'),
(3, 'Alta');

-- --------------------------------------------------------

--
-- Estrutura para tabela `projetos`
--

CREATE TABLE `projetos` (
  `id` int(11) NOT NULL,
  `nome` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `projetos`
--

INSERT INTO `projetos` (`id`, `nome`) VALUES
(1, 'Aniversariantes'),
(2, 'Plataforma'),
(3, 'gestão RH'),
(4, 'Hortipanc'),
(5, 'Transporte'),
(6, 'Ouvidoria'),
(7, 'SGI'),
(8, 'API TOTVS RM'),
(9, 'EPAMIG Sustentável'),
(10, 'Reserva Multimeios/Auditório'),
(11, 'Sistema de Contratos'),
(12, 'Germoplasma'),
(13, 'Diárias'),
(14, 'Portarias'),
(15, 'Super Rede de Plantas Medicinais'),
(16, 'CheckON'),
(17, 'Transparência'),
(18, 'Kanban'),
(19, 'Gestão de Obras'),
(20, 'LGPD');

-- --------------------------------------------------------

--
-- Estrutura para tabela `responsaveis`
--

CREATE TABLE `responsaveis` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `responsaveis`
--

INSERT INTO `responsaveis` (`id`, `email`, `image_url`) VALUES
(3, 'arthur.souza@epamig.br', 'https://lh3.googleusercontent.com/a/ACg8ocKERSpoQT20BiyfeB7z_zl3LNOdSYAuXddJxK1zz8mvZyDv-tqj=s96-c'),
(4, 'rodolfo.fernandes@epamig.br', NULL),
(5, 'michelle@epamig.br', NULL),
(6, 'victor.purri@epamig.br', NULL),
(7, 'alexsolano@epamig.br', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `setor`
--

CREATE TABLE `setor` (
  `id` int(11) NOT NULL,
  `sigla` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `setor`
--

INSERT INTO `setor` (`id`, `sigla`) VALUES
(1, 'AINF'),
(2, 'ASAGRO'),
(3, 'ASCOM'),
(4, 'ASGE'),
(5, 'ASJU'),
(6, 'AUDI'),
(7, 'CEAC'),
(8, 'CEAR'),
(9, 'CECD'),
(10, 'CEFX'),
(11, 'CEGR'),
(12, 'CEGT'),
(13, 'CEJA'),
(14, 'CELA'),
(15, 'CELB'),
(16, 'CELP'),
(17, 'CEMA'),
(18, 'CEMC'),
(19, 'CEMF'),
(20, 'CEMO'),
(21, 'CEPC'),
(22, 'CERN'),
(23, 'CESP'),
(24, 'CESR'),
(25, 'CEST'),
(26, 'CETP'),
(27, 'CEVP'),
(28, 'DPAD'),
(29, 'DPCO'),
(30, 'DPGF'),
(31, 'DPGP'),
(32, 'DPIT'),
(33, 'DPPE'),
(34, 'DRAF'),
(35, 'DROT'),
(36, 'DVAC'),
(37, 'DVAP'),
(38, 'DVCC'),
(39, 'DVCP'),
(40, 'DVCT'),
(41, 'DVDP'),
(42, 'DVED'),
(43, 'DVFI'),
(44, 'DVFS'),
(45, 'DVIP'),
(46, 'DVLP'),
(47, 'DVOC'),
(48, 'DVOS'),
(49, 'DVTD'),
(50, 'EDUCAÇÃO'),
(51, 'GAPR'),
(52, 'ILCT'),
(53, 'ITAP'),
(54, 'PRES'),
(55, 'VIÇOSA');

-- --------------------------------------------------------

--
-- Estrutura para tabela `status`
--

CREATE TABLE `status` (
  `id` int(11) NOT NULL,
  `nome` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `status`
--

INSERT INTO `status` (`id`, `nome`) VALUES
(1, 'Não iniciada'),
(2, 'Em desenvolvimento'),
(3, 'Em testes'),
(4, 'Concluída');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `atividades`
--
ALTER TABLE `atividades`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_atividades_sistema` (`projeto_id`),
  ADD KEY `idx_atividades_status` (`status_id`),
  ADD KEY `idx_atividades_prioridade` (`prioridade_id`),
  ADD KEY `fk_atividades_setor` (`setor_id`);

--
-- Índices de tabela `atividades_responsaveis`
--
ALTER TABLE `atividades_responsaveis`
  ADD PRIMARY KEY (`atividade_id`,`responsavel_id`),
  ADD KEY `responsavel_id` (`responsavel_id`);

--
-- Índices de tabela `prioridades`
--
ALTER TABLE `prioridades`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `projetos`
--
ALTER TABLE `projetos`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `responsaveis`
--
ALTER TABLE `responsaveis`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `setor`
--
ALTER TABLE `setor`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `status`
--
ALTER TABLE `status`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `atividades`
--
ALTER TABLE `atividades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT de tabela `projetos`
--
ALTER TABLE `projetos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de tabela `responsaveis`
--
ALTER TABLE `responsaveis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de tabela `setor`
--
ALTER TABLE `setor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `atividades`
--
ALTER TABLE `atividades`
  ADD CONSTRAINT `atividades_ibfk_2` FOREIGN KEY (`projeto_id`) REFERENCES `projetos` (`id`),
  ADD CONSTRAINT `atividades_ibfk_3` FOREIGN KEY (`prioridade_id`) REFERENCES `prioridades` (`id`),
  ADD CONSTRAINT `atividades_ibfk_4` FOREIGN KEY (`status_id`) REFERENCES `status` (`id`),
  ADD CONSTRAINT `fk_atividades_setor` FOREIGN KEY (`setor_id`) REFERENCES `setor` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
