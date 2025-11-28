"use client";
import { useState, useEffect, useRef } from "react";
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
}

export default function ConsultaConhecimento() {
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [tipo, setTipo] = useState("");
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
  const [editDescricao, setEditDescricao] = useState("");
  const [editFileData, setEditFileData] = useState<{
    base64: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [pagina, setPagina] = useState(1);
  const registrosPorPagina = 10;

  // ref para o input file
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    buscarRegistros();
  }, []);

  function handleLimpar() {
    setNome("");
    setData("");
    setTipo("");
    buscarRegistros();
  }

  function formatDate(raw: string | number | null) {
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
  }

  async function buscarRegistros(params?: URLSearchParams) {
    setCarregando(true);
    setErro("");
    try {
      const url = params ? `/api/conhecimento?${params.toString()}` : `/api/conhecimento`;
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
  }

  async function handleBuscar() {
    const queryParams = new URLSearchParams();
    if (nome) queryParams.append("nome", nome);
    if (data) queryParams.append("data", data);
    if (tipo) queryParams.append("tipo", tipo);
    buscarRegistros(queryParams);
  }

  const totalPaginas = Math.ceil(registros.length / registrosPorPagina);
  const registrosPaginaAtual = registros.slice(
    (pagina - 1) * registrosPorPagina,
    pagina * registrosPorPagina
  );

  // Abre modal de visualização e carrega registro completo
  async function openView(id: number) {
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
  }

  // Abre modal de edição, carrega registro e preenche o formulário
  async function openEdit(id: number) {
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
      // Reseta arquivo e input file
      setEditFileData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setModalError("");
      setEditOpen(true);
    } catch {
      setErro("Erro ao buscar registro");
    }
    setActionLoading(false);
  }

  function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
  }

  // Salva edição via API PUT
  async function handleSaveEdit() {
    if (!selected) return;
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
        anexo?: AnexoPayload;
      };

      const body: EditBody = {
        nome: editNome,
        tipo: typeof editTipo === "string" ? Number(editTipo) : (editTipo as number),
        descricao: editDescricao,
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
        buscarRegistros();
      }
    } catch (err) {
      setModalError(String(err) || "Erro ao atualizar registro");
    }
    setActionLoading(false);
  }

  // Excluir com confirmação
  async function handleDelete(id: number) {
    const confirma = window.confirm("Deseja realmente apagar este registro?");
    if (!confirma) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/conhecimento/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || "Erro ao excluir");
      } else {
        buscarRegistros();
      }
    } catch {
      setErro("Erro ao excluir registro");
    }
    setActionLoading(false);
  }

  return (
    <div className="p-4 w-full max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:gap-4">
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="border rounded px-3 py-2 flex-1 min-w-0 outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="border rounded px-3 py-2 flex-1 min-w-0 outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="border rounded px-3 py-2 flex-1 min-w-0 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="">Todos os Tipos</option>
          <option value="0">Tutorial</option>
          <option value="1">POP</option>
        </select>
        <div className="flex gap-2">
          <div className="flex flex-row gap-2 justify-center w-full sm:w-auto">
            <button
              onClick={handleBuscar}
              disabled={carregando}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-primary text-emerald-800 border font-medium rounded-md shadow hover:bg-emerald-500/15 transition"
            >
              <Search size={16} />
              {carregando ? "Buscando..." : "Buscar"}
            </button>

            <button
              onClick={handleLimpar}
              disabled={carregando}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-white-200 text-red-800 border font-medium rounded-md shadow hover:bg-red-400/15 transition"
              type="button"
            >
              <Trash2 size={16} />
              Limpar
            </button>
          </div>
        </div>
      </div>

      {erro && <p className="text-red-600 mb-4">{erro}</p>}

      {!erro && registros.length === 0 && <p>Nenhum cadastro encontrado.</p>}

      {registros.length > 0 && (
        <>
          <table className="w-full border-collapse border-gray-300 text-left">
            <colgroup>
              <col style={{ width: "42%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="border border-gray-300 px-2 py-2 break-words">Nome</th>
                <th className="border border-gray-300 px-2 py-2 break-words">Data de Publicação</th>
                <th className="border border-gray-300 px-2 py-2 break-words">Tipo</th>
                <th className="border border-gray-300 px-2 py-2 break-words">Ações</th>
              </tr>
            </thead>
            <tbody>
              {registrosPaginaAtual.map(({ id, nome, dt_publicacao, tipo }) => (
                <tr key={id} className="align-top hover:bg-gray-100/50">
                  <td className="border border-gray-300 px-2 py-3 break-words">{nome}</td>
                  <td className="border border-gray-300 px-2 py-3 break-words">{formatDate(dt_publicacao)}</td>
                  <td className="border border-gray-300 px-2 py-3 break-words">
                    {tipo === 0 ? "Tutorial" : "POP"}
                  </td>
                  <td className="border border-gray-300 px-2 py-3 flex flex-wrap gap-2 justify-center items-center">
                    <button
                      onClick={() => openView(id)}
                      title="Visualizar"
                      className="flex items-center justify-center p-2 rounded shadow outline-none bg-sky-100 text-sky-700 hover:bg-sky-200 focus:ring-2 focus:ring-sky-300 transition w-auto min-w-[36px]"
                      aria-label="Visualizar"
                      type="button"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={() => openEdit(id)}
                      title="Editar"
                      className="flex items-center justify-center p-2 rounded shadow outline-none bg-yellow-100/60 text-yellow-700 hover:bg-yellow-200 focus:ring-2 focus:ring-yellow-300 transition w-auto min-w-[36px]"
                      aria-label="Editar"
                      type="button"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      title="Excluir"
                      className="flex items-center justify-center p-2 rounded shadow outline-none bg-red-100 text-red-700 hover:bg-red-200 focus:ring-2 focus:ring-red-300 transition w-auto min-w-[36px]"
                      aria-label="Excluir"
                      type="button"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-center mt-4 gap-2">
            <button
              onClick={() => setPagina(pagina - 1)}
              disabled={pagina === 1}
              className="px-3 py-1 bg-gray-100 flex justify-center text-center rounded hover:bg-gray-200/80 disabled:opacity-50"
            >
              <ArrowLeft size={20} />
              Anterior
            </button>
            <span>
              Página {pagina} de {totalPaginas}
            </span>
            <button
              onClick={() => setPagina(pagina + 1)}
              disabled={pagina === totalPaginas}
              className="px-3 py-1 bg-gray-100 flex justify-center text-center rounded hover:bg-gray-200/80 disabled:opacity-50"
            >
              Próxima
              <ArrowRight size={20} />
            </button>
          </div>
        </>
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

            <div className="sm:col-span-2">
              <div className="text-sm font-medium">Descrição</div>
              <textarea
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                className="border rounded w-full px-3 py-3 mt-1 min-h-[240px] resize-none outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

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
