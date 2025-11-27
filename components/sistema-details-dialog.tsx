'use client';

import { Sistema } from '@/types/sistema';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  ExternalLink, 
  Calendar, 
  Database, 
  Server, 
  GitBranch,
  FileText,
  Link as LinkIcon,
  User,
  Clock,
} from 'lucide-react';
import { getTipoLabel, getStatusLabel } from '@/lib/sistema-utils';

interface SistemaDetailsDialogProps {
  sistema: Sistema;
  children: React.ReactNode;
}

const statusColors: Record<number, string> = {
  1: 'bg-green-500',      // Produção
  2: 'bg-blue-500',       // Em Desenvolvimento
  3: 'bg-yellow-500',     // Manutenção
  4: 'bg-red-500',        // Descontinuado
};

const tipoColors: Record<number, string> = {
  1: 'bg-purple-500',     // Sistema
  2: 'bg-cyan-500',       // Site
  3: 'bg-orange-500',     // API
  4: 'bg-indigo-500',     // Mobile
  5: 'bg-pink-500',       // Rotina
  6: 'bg-gray-500',       // Infraestrutura
  7: 'bg-slate-500',      // Outros
};

export function SistemaDetailsDialog({ sistema, children }: SistemaDetailsDialogProps) {
  const formatDate = (date: string | null) => {
    if (!date) return 'Não informado';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{sistema.nome}</DialogTitle>
              {sistema.sigla && (
                <p className="text-muted-foreground mt-1">{sistema.sigla}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge className={tipoColors[sistema.tipo]}>{getTipoLabel(sistema.tipo)}</Badge>
              <Badge className={statusColors[sistema.status]}>
                {getStatusLabel(sistema.status)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Objetivo */}
          {sistema.objetivo && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Objetivo
              </h3>
              <p className="text-sm text-muted-foreground">{sistema.objetivo}</p>
            </div>
          )}

          {/* Informações Técnicas */}
          <div>
            <h3 className="font-semibold mb-3">Informações Técnicas</h3>
            <div className="grid grid-cols-2 gap-4">
              {sistema.tecnologia_principal && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Tecnologia Principal
                  </p>
                  <p className="text-sm font-medium">{sistema.tecnologia_principal}</p>
                </div>
              )}
              {sistema.servidor && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Server className="h-3 w-3" />
                    Servidor
                  </p>
                  <p className="text-sm font-medium">{sistema.servidor}</p>
                </div>
              )}
              {sistema.banco_dados && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    Banco de Dados
                  </p>
                  <p className="text-sm font-medium">{sistema.banco_dados}</p>
                </div>
              )}
              {sistema.data_inicio && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Data de Início
                  </p>
                  <p className="text-sm font-medium">{formatDate(sistema.data_inicio)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Links e Repositórios
            </h3>
            <div className="space-y-2">
              {sistema.url_producao && (
                <div>
                  <a
                    href={sistema.url_producao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Ambiente de Produção <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {sistema.url_homologacao && (
                <div>
                  <a
                    href={sistema.url_homologacao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Ambiente de Homologação <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {sistema.repositorio_git && (
                <div>
                  <a
                    href={sistema.repositorio_git}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <GitBranch className="h-3 w-3" />
                    Repositório Git <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {sistema.url_documentacao && (
                <div>
                  <a
                    href={sistema.url_documentacao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Documentação <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Integrações */}
          {sistema.sistemas_integrados && (
            <div>
              <h3 className="font-semibold mb-2">Sistemas Integrados</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {sistema.sistemas_integrados}
              </p>
            </div>
          )}

          {/* Rotinas */}
          {sistema.rotinas_principais && (
            <div>
              <h3 className="font-semibold mb-2">Rotinas Principais</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {sistema.rotinas_principais}
              </p>
            </div>
          )}

          {/* Observações */}
          {sistema.observacoes && (
            <div>
              <h3 className="font-semibold mb-2">Observações</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {sistema.observacoes}
              </p>
            </div>
          )}

          {/* Auditoria */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Informações de Auditoria
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {sistema.quem_cadastrou && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Cadastrado por</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {sistema.quem_cadastrou}
                  </p>
                </div>
              )}
              {sistema.quem_editou && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Última edição por</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {sistema.quem_editou}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Data de criação</p>
                <p className="font-medium">{formatDate(sistema.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Última atualização</p>
                <p className="font-medium">{formatDate(sistema.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
