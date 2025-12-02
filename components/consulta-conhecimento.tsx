"use client";
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Download,
  FolderOpen,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { KNOWLEDGE_CATEGORIES } from "@/lib/constants";

interface Registro {
  id: number;
  nome: string;
  dt_publicacao: string | number;
  tipo: 0 | 1;
  descricao?: string;
  nome_autor?: string;
  email_autor?: string;
  dt_modificacao?: string | number;
  email_modificador?: string;
  anexo_id?: number;
  link?: string | null;
  categoria?: string | null;
}

type Filters = {
  nome: string;
  data: string;
  tipo: string;
  categoria: string;
};

const DEFAULT_FILTERS: Filters = {
  nome: "",
  data: "",
  tipo: "",
  categoria: ""
};

const REGISTROS_POR_PAGINA = 10;

export default function ConsultaConhecimento() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Registro | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // edit form state
  const [editNome, setEditNome] = useState("");
  const [editTipo, setEditTipo] = useState<string | number>("");
  const [editCategoria, setEditCategoria] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editFileData, setEditFileData] = useState<{
    base64: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [pagina, setPagina] = useState(1);

  // ref para o input file
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatDate = useCallback((raw: string | number | null) => {
    if (!raw) return "";
    let date: Date;
    if (typeof raw === "number") {
      date = new Date(raw * 1000);
    } else if (/^\d+$/.test(raw)) {
      date = new Date(Number(raw) * 1000);
    } else {
      date = new Date(raw);
    }
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  const fetchRegistros = useCallback(async (activeFilters: Filters) => {
    setCarregando(true);
    setErro("");
    setFilters({ ...activeFilters });
    try {
      const queryParams = new URLSearchParams();
      if (activeFilters.nome) queryParams.append("nome", activeFilters.nome);
      if (activeFilters.data) queryParams.append("data", activeFilters.data);
      if (activeFilters.tipo) queryParams.append("tipo", activeFilters.tipo);
      if (activeFilters.categoria) queryParams.append("categoria", activeFilters.categoria);
      const queryString = queryParams.toString();
      const url = queryString ? `/api/conhecimento?${queryString}` : `/api/conhecimento`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || "Erro desconhecido");
        setRegistros([]);
      } else {
        setRegistros(json);
        setPagina(1);
      }
    } catch {
      setErro("Erro ao buscar dados");
      setRegistros([]);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    fetchRegistros(DEFAULT_FILTERS);
  }, [fetchRegistros]);

  const handleBuscar = useCallback((nextFilters: Filters) => {
    fetchRegistros(nextFilters);
  }, [fetchRegistros]);

  const handleResetFilters = useCallback(() => {
    fetchRegistros(DEFAULT_FILTERS);
  }, [fetchRegistros]);

  const totalPaginas = useMemo(() => (
    registros.length ? Math.ceil(registros.length / REGISTROS_POR_PAGINA) : 0
  ), [registros.length]);

  const registrosPaginaAtual = useMemo(() => {
    if (!registros.length) return [] as Registro[];
    const start = (pagina - 1) * REGISTROS_POR_PAGINA;
    return registros.slice(start, start + REGISTROS_POR_PAGINA);
  }, [pagina, registros]);

  const handlePageChange = useCallback((nextPage: number) => {
    setPagina(nextPage);
  }, []);

  // Abre modal de visualização e carrega registro completo
  const openView = useCallback(async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/conhecimento/${id}`);
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || "Erro ao buscar registro");
        return;
      }
      setSelected(json);
      setViewOpen(true);
    } catch {
      setErro("Erro ao buscar registro");
    }
    setActionLoading(false);
  }, []);

  // Abre modal de edição, carrega registro e preenche o formulário
  const openEdit = useCallback(async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/conhecimento/${id}`);
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || "Erro ao buscar registro");
        return;
      }
      setSelected(json);
      setEditNome(json.nome || "");
      setEditTipo(json.tipo ?? "");
      setEditDescricao(json.descricao || "");
      setEditLink(json.link || "");
      setEditCategoria(json.categoria || "");
      // Reseta arquivo e input file
      setEditFileData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setModalError("");
      setEditOpen(true);
    } catch {
      setErro("Erro ao buscar registro");
    }
    setActionLoading(false);
  }, []);

  const handleEditFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) {
      setEditFileData(null);
      return;
    }
    // allow only PDF files
    const isPdfByType = f.type === "application/pdf";
    const isPdfByName = f.name && f.name.toLowerCase().endsWith(".pdf");
    if (!isPdfByType && !isPdfByName) {
      setEditFileData(null);
      setModalError("Apenas arquivos PDF são permitidos.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(",");
      const rawBase64 = commaIndex > 0 ? result.substring(commaIndex + 1) : result;
      setModalError("");
      setEditFileData({
        base64: rawBase64,
        name: f.name,
        type: f.type || "application/pdf",
        size: f.size,
      });
    };
    reader.readAsDataURL(f);
  }, []);

  // Salva edição via API PUT
  const handleSaveEdit = useCallback(async () => {
    if (!selected) return;
    if (!editCategoria) {
      setModalError("Selecione uma categoria.");
      return;
    }
    setActionLoading(true);
    setModalError("");
    try {
      type AnexoPayload = {
        nome_arquivo?: string;
        tipo_arquivo?: string;
        tamanho_bytes?: number;
        conteudo_base64?: string;
      };
      type EditBody = {
        nome: string;
        tipo: number;
        descricao: string;
        categoria: string;
        link?: string | null;
        anexo?: AnexoPayload;
      };

      const body: EditBody = {
        nome: editNome,
        tipo: typeof editTipo === "string" ? Number(editTipo) : (editTipo as number),
        descricao: editDescricao,
        categoria: editCategoria,
        link: editLink.trim() ? editLink.trim() : null,
      };
      if (editFileData) {
        body.anexo = {
          nome_arquivo: editFileData.name,
          tipo_arquivo: editFileData.type,
          tamanho_bytes: editFileData.size,
          conteudo_base64: editFileData.base64,
        };
      }
      const res = await fetch(`/api/conhecimento/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let json: Record<string, unknown> = {};
      try {
        const parsed = await res.json();
        if (parsed && typeof parsed === "object") json = parsed as Record<string, unknown>;
      } catch {
        // ignore parse errors
      }
      if (!res.ok) {
        // mostrar erro dentro do modal para feedback imediato
        const detalhe = (json["detalhe"] as string) || (json["erro"] as string) || JSON.stringify(json || "");
        setModalError(detalhe || "Erro ao atualizar");
      } else {
        // fechar modal e atualizar lista
        setEditOpen(false);
        setErro("");
        setModalError("");
        setEditLink("");
        setEditCategoria("");
        fetchRegistros(filters);
      }
    } catch (err) {
      setModalError(String(err) || "Erro ao atualizar registro");
    }
    setActionLoading(false);
  }, [editCategoria, editDescricao, editFileData, editLink, editNome, editTipo, fetchRegistros, filters, selected]);

  // Excluir com confirmação
  const handleDelete = useCallback(async (id: number) => {
    const confirma = window.confirm("Deseja realmente apagar este registro?");
    if (!confirma) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/conhecimento/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || "Erro ao excluir");
      } else {
        fetchRegistros(filters);
      }
    } catch {
      setErro("Erro ao excluir registro");
    }
    setActionLoading(false);
  }, [fetchRegistros, filters]);

  return (
    <div className="p-4 w-full max-w-6xl mx-auto">
      <FilterBar
        filters={filters}
        carregando={carregando}
        onBuscar={handleBuscar}
        onReset={handleResetFilters}
      />

      {erro && <p className="text-red-600 mb-4">{erro}</p>}

      {!erro && registros.length === 0 && <p>Nenhum cadastro encontrado.</p>}

      {registros.length > 0 && (
        <RegistroTable
          registros={registrosPaginaAtual}
          pagina={pagina}
          totalPaginas={totalPaginas}
          onPageChange={handlePageChange}
          onView={openView}
          onEdit={openEdit}
          onDelete={handleDelete}
          formatDate={formatDate}
        />
      )}

      {/* Modal de visualização */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="w-full max-w-3xl rounded-lg p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold">Visualizar registro</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              ID: {selected?.id ?? "-"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-800">
            <div>
              <div className="font-medium">Nome</div>
              <div className="mt-1">{selected?.nome || "-"}</div>
            </div>
            <div>
              <div className="font-medium">Tipo</div>
              <div className="mt-1">{selected?.tipo === 0 ? "Tutorial" : "POP"}</div>
            </div>
            <div>
              <div className="font-medium">Categoria</div>
              <div className="mt-1">{selected?.categoria || "-"}</div>
            </div>
            <div>
              <div className="font-medium">Autor</div>
              <div className="mt-1">
                {selected?.nome_autor || "-"} ({selected?.email_autor || "-"})
              </div>
            </div>
            <div>
              <div className="font-medium">Data de publicação</div>
              <div className="mt-1">{formatDate(selected?.dt_publicacao ?? null)}</div>
            </div>
              <div className="sm:col-span-2">
              <div className="font-medium">Descrição</div>
              <div className="mt-1 p-3 border rounded bg-gray-50 min-h-[200px] whitespace-pre-wrap">
                {selected?.descricao || "-"}
              </div>
            </div>
              <div className="sm:col-span-2">
                <div className="font-medium">Link associado</div>
                {selected?.link ? (
                  <a
                    href={selected.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center text-emerald-700 underline break-all"
                  >
                    {selected.link}
                  </a>
                ) : (
                  <div className="mt-1 text-gray-500">Nenhum link informado.</div>
                )}
              </div>
          </div>

          {selected?.anexo_id ? (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() =>
                  window.open(`/api/conhecimento/anexos/${selected.anexo_id}?inline=1`, "_blank")
                }
                className="px-4 py-2 bg-gray-100 shadow rounded hover:bg-blue-200/80 transition"
                type="button"
              >
                <Eye size={16} className="inline-block mr-2 text-blue-600 " />
                Visualizar arquivo
              </button>

              <button
                onClick={() => window.open(`/api/conhecimento/anexos/${selected.anexo_id}`, "_blank")}
                className="px-4 py-2 bg-gray-100 shadow rounded hover:bg-red-200/80 transition"
                type="button"
              >
                <Download size={16} className="inline-block mr-2 text-red-600" />
                Baixar
              </button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Modal de edição */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-full max-w-3xl rounded-lg p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold">Editar registro</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              ID: {selected?.id ?? "-"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm font-medium">Nome</div>
              <input
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                className="border rounded w-full px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium">Tipo</div>
              <select
                value={String(editTipo)}
                onChange={(e) => setEditTipo(e.target.value)}
                className="border rounded w-full px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="0">Tutorial</option>
                <option value="1">POP</option>
              </select>
            </label>

            <label className="block">
              <div className="text-sm font-medium">Categoria</div>
              <select
                value={editCategoria}
                onChange={(e) => setEditCategoria(e.target.value)}
                className="border rounded w-full px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Selecione</option>
                {KNOWLEDGE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <div className="sm:col-span-2">
              <div className="text-sm font-medium">Descrição</div>
              <textarea
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                className="border rounded w-full px-3 py-3 mt-1 min-h-[240px] resize-none outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <label className="block sm:col-span-2">
              <div className="text-sm font-medium">Link de apoio (opcional)</div>
              <input
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
                type="url"
                placeholder="https://..."
                className="border rounded w-full px-3 py-2 mt-1 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </label>

            <div className="sm:col-span-2">
              <div className="text-sm font-medium">Novo arquivo</div>
              <div className="w-full flex items-center px-4 py-2 border rounded-md cursor-pointer focus-within:ring-2 focus-within:ring-emerald-500 bg-white">
                <label htmlFor="ed-arquivo" className="flex items-center w-full cursor-pointer relative">
                  <FolderOpen className="w-5 h-5 text-emerald-800 mr-2" />
                  <span className="text-sm text-gray-700 flex-1">
                    {editFileData ? (
          <span className="flex items-center">
            Arquivo selecionado: {editFileData.name}
            <button
              type="button"
              className="ml-2 text-red-600 bg-red-100 rounded-full w-6 h-6 flex items-center justify-center text-xs"
              title="Remover arquivo"
              tabIndex={0}
              onClick={e => {
                e.stopPropagation();
                setEditFileData(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setModalError("");
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ) : (
          "Escolher arquivo"
        )}
                  </span>
                  <input
                    id="ed-arquivo"
                    type="file"
                    accept="application/pdf"
                    onChange={handleEditFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                </label>
              </div>
            </div>
          </div>

          {modalError && (
            <div className="mt-3 p-3 bg-red-50 text-red-700 border border-red-100 rounded">
              <strong>Erro:</strong> {modalError}
            </div>
          )}

          <DialogFooter>
            <div className="flex flex-row justify-end gap-2 w-full mt-4">
              <button
                onClick={() => {
                  setEditOpen(false);
                  setEditFileData(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  setModalError("");
                  setEditLink("");
                  setEditCategoria("");
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                {actionLoading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type FilterBarProps = {
  filters: Filters;
  carregando: boolean;
  onBuscar: (filters: Filters) => void;
  onReset: () => void;
};

const FilterBar = memo(function FilterBar({ filters, carregando, onBuscar, onReset }: FilterBarProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateField = useCallback((field: keyof Filters, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback((event?: React.FormEvent) => {
    if (event) event.preventDefault();
    onBuscar(localFilters);
  }, [localFilters, onBuscar]);

  const handleReset = useCallback(() => {
    setLocalFilters({ ...DEFAULT_FILTERS });
    onReset();
  }, [onReset]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6 sm:flex-row sm:gap-4">
      <input
        type="text"
        placeholder="Nome"
        value={localFilters.nome}
        onChange={(e) => updateField("nome", e.target.value)}
        className="border rounded px-3 py-2 flex-1 min-w-0 outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <input
        type="date"
        value={localFilters.data}
        onChange={(e) => updateField("data", e.target.value)}
        className="border rounded px-3 py-2 flex-1 min-w-0 outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <select
        value={localFilters.tipo}
        onChange={(e) => updateField("tipo", e.target.value)}
        className="border rounded px-3 py-2 flex-1 min-w-0 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
      >
        <option value="">Todos os Tipos</option>
        <option value="0">Tutorial</option>
        <option value="1">POP</option>
      </select>
      <select
        value={localFilters.categoria}
        onChange={(e) => updateField("categoria", e.target.value)}
        className="border rounded px-3 py-2 flex-1 min-w-0 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
      >
        <option value="">Todas as Categorias</option>
        {KNOWLEDGE_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <div className="flex flex-row gap-2 justify-center w-full sm:w-auto">
          <button
            type="submit"
            disabled={carregando}
            className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-primary text-emerald-800 border font-medium rounded-md shadow hover:bg-emerald-500/15 transition disabled:opacity-50"
          >
            <Search size={16} />
            {carregando ? "Buscando..." : "Buscar"}
          </button>

          <button
            onClick={handleReset}
            disabled={carregando}
            className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-white-200 text-red-800 border font-medium rounded-md shadow hover:bg-red-400/15 transition disabled:opacity-50"
            type="button"
          >
            <Trash2 size={16} />
            Limpar
          </button>
        </div>
      </div>
    </form>
  );
});

FilterBar.displayName = "FilterBar";

type RegistroTableProps = {
  registros: Registro[];
  pagina: number;
  totalPaginas: number;
  onPageChange: (page: number) => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  formatDate: (raw: string | number | null) => string;
};

const RegistroTable = memo(function RegistroTable({
  registros,
  pagina,
  totalPaginas,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  formatDate
}: RegistroTableProps) {
  const handlePrev = useCallback(() => onPageChange(pagina - 1), [onPageChange, pagina]);
  const handleNext = useCallback(() => onPageChange(pagina + 1), [onPageChange, pagina]);

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-gray-100 shadow-sm">
        <table className="w-full text-left text-sm">
          <colgroup>
            <col style={{ width: "34%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "14%" }} />
          </colgroup>
          <thead className="bg-emerald-50/80 text-emerald-900 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Data de Publicação</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((registro) => (
              <RegistroRow
                key={registro.id}
                registro={registro}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                formatDate={formatDate}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-4 gap-2">
        <button
          onClick={handlePrev}
          disabled={pagina === 1 || totalPaginas === 0}
          className="px-3 py-1 bg-gray-100 flex justify-center text-center rounded hover:bg-gray-200/80 disabled:opacity-50"
        >
          <ArrowLeft size={20} />
          Anterior
        </button>
        <span>
          Página {pagina} de {totalPaginas}
        </span>
        <button
          onClick={handleNext}
          disabled={pagina === totalPaginas || totalPaginas === 0}
          className="px-3 py-1 bg-gray-100 flex justify-center text-center rounded hover:bg-gray-200/80 disabled:opacity-50"
        >
          Próxima
          <ArrowRight size={20} />
        </button>
      </div>
    </>
  );
});

RegistroTable.displayName = "RegistroTable";

type RegistroRowProps = {
  registro: Registro;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  formatDate: (raw: string | number | null) => string;
};

const RegistroRow = memo(function RegistroRow({ registro, onView, onEdit, onDelete, formatDate }: RegistroRowProps) {
  const { id, nome, dt_publicacao, tipo, categoria } = registro;

  return (
    <tr className="border-t border-gray-100/80 text-gray-700 hover:bg-gray-50/70">
      <td className="px-4 py-4">
        <div className="font-semibold text-gray-900">{nome}</div>
        <p className="text-xs text-gray-500 mt-1">ID #{id}</p>
      </td>
      <td className="px-4 py-4">
        {categoria ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {categoria}
          </span>
        ) : (
          <span className="text-xs text-gray-400">Sem categoria</span>
        )}
      </td>
      <td className="px-4 py-4 text-sm">{formatDate(dt_publicacao ?? null)}</td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            tipo === 0 ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {tipo === 0 ? "Tutorial" : "POP"}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => onView(id)}
            title="Visualizar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sky-600 shadow ring-1 ring-sky-100 transition hover:bg-sky-50"
            aria-label="Visualizar"
            type="button"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => onEdit(id)}
            title="Editar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-amber-600 shadow ring-1 ring-amber-100 transition hover:bg-amber-50"
            aria-label="Editar"
            type="button"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => onDelete(id)}
            title="Excluir"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 shadow ring-1 ring-red-100 transition hover:bg-red-50"
            aria-label="Excluir"
            type="button"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
});

RegistroRow.displayName = "RegistroRow";
