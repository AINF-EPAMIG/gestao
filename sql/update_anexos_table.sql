-- Adiciona colunas para armazenar informações do Google Drive
ALTER TABLE u711845530_gestao.anexos
ADD COLUMN drive_file_id VARCHAR(255) NULL COMMENT 'ID do arquivo no Google Drive',
ADD COLUMN drive_view_link TEXT NULL COMMENT 'Link para visualização do arquivo no Google Drive';

-- Adiciona índice para melhorar a performance de consultas pelo ID do arquivo no Google Drive
CREATE INDEX idx_drive_file_id ON u711845530_gestao.anexos (drive_file_id); 