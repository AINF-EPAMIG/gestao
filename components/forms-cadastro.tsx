"use client";
import { useState, useRef } from "react";
import { Check, CheckCircle, FolderOpen, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { KNOWLEDGE_CATEGORIES } from "@/lib/constants";

export default function FormsCadastro() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    tipo: null as number | null,
    categoria: "",
    descricao: "",
    link: ""
  });
  const [mensagem, setMensagem] = useState("");
  const [fileData, setFileData] = useState<{
    base64: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [fileError, setFileError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "tipo" ? (value === "" ? null : Number(value)) : value
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) {
      setFileData(null);
      return;
    }
    // only allow PDF files client-side (server also enforces this)
    const isPdfByType = f.type === 'application/pdf';
    const isPdfByName = f.name && f.name.toLowerCase().endsWith('.pdf');
    if (!isPdfByType && !isPdfByName) {
      setFileData(null);
      setFileError('Apenas arquivos PDF são permitidos.');
      if (fileInputRef.current) {
        try { fileInputRef.current.value = ''; } catch { }
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // remove data URI prefix if present when storing
      const commaIndex = result.indexOf(',');
      const rawBase64 = commaIndex > 0 ? result.substring(commaIndex + 1) : result;
      setFileError("");
      setFileData({ base64: rawBase64, name: f.name, type: f.type || 'application/pdf', size: f.size });
    };
    reader.readAsDataURL(f);
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function clearFile(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setFileData(null);
    setFileError("");
    if (fileInputRef.current) {
      try { fileInputRef.current.value = ""; } catch { }
    }
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // require attachment
    if (!fileData) {
      setFileError("Anexo obrigatório. Por favor selecione um arquivo.");
      return;
    }
    setFileError("");
    // prepare payload, include anexo
    type AnexoPayload = {
      nome_arquivo: string;
      tipo_arquivo: string;
      tamanho_bytes: number;
      conteudo_base64: string;
    };
    type Payload = {
      nome: string;
      tipo: number | null;
      categoria: string;
      descricao: string;
      link?: string;
      anexo?: AnexoPayload;
    };

    const payload: Payload = { ...form };
    if (payload.link) {
      const trimmedLink = payload.link.trim();
      if (trimmedLink) payload.link = trimmedLink;
      else delete payload.link;
    }
    if (fileData) {
      payload.anexo = {
        nome_arquivo: fileData.name,
        tipo_arquivo: fileData.type,
        tamanho_bytes: fileData.size,
        conteudo_base64: fileData.base64
      };
    }

    const resp = await fetch("/api/conhecimento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await resp.json();
    if (resp.ok) {
      setMensagem(result.mensagem);
      setForm({ nome: "", tipo: null, categoria: "", descricao: "", link: "" });
      setFileData(null);
    } else {
      setMensagem(result.erro || "Falha ao cadastrar.");
    }
  }

  return (
    <div className="flex justify-center px-4 py-8">
      <div className="w-full max-w-5xl space-y-6">
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-sm">
          <p className="mt-2 text-3xl font-semibold leading-tight text-gray-900">Área de conhecimento</p>
          <p className="mt-3 text-sm text-gray-500">
            Preencha os campos abaixo e anexe o PDF final. Assim que salvar, o documento já fica disponível para consulta e download no dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-gray-100 bg-white/95 p-6 shadow-lg md:p-8 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="nome" className="text-sm font-medium text-gray-700">
                Nome do Material
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                value={form.nome}
                onChange={handleChange}
                placeholder="Digite o nome"
                required
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="tipo" className="text-sm font-medium text-gray-700">
                Tipo do Material
              </label>
              <select
                id="tipo"
                name="tipo"
                value={form.tipo === null ? "" : form.tipo}
                onChange={handleChange}
                required
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Selecione o tipo</option>
                <option value={0}>Tutorial</option>
                <option value={1}>Pop</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="categoria" className="text-sm font-medium text-gray-700">
                Categoria
              </label>
              <select
                id="categoria"
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                required
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Selecione a categoria</option>
                {KNOWLEDGE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="link" className="text-sm font-medium text-gray-700">
                Link de apoio (opcional)
              </label>
              <input
                id="link"
                name="link"
                type="url"
                value={form.link}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="descricao" className="text-sm font-medium text-gray-700">
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              placeholder="Explique do que trata esse material"
              required
              rows={5}
              className="w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-400">Descreva o conteúdo para facilitar buscas futuras.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Anexo em PDF</label>
            <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-4">
              <label htmlFor="arquivo" className="flex flex-col items-center justify-center gap-2 text-center cursor-pointer">
                {fileData ? (
                  <CheckCircle className="w-9 h-9 text-emerald-600" />
                ) : (
                  <FolderOpen className="w-8 h-8 text-emerald-700" />
                )}
                <div className="text-sm text-gray-700">
                  {fileData ? (
                    <span className="font-medium">{fileData.name}</span>
                  ) : (
                    <>
                      Arraste e solte ou <span className="text-emerald-700 underline">clique para selecionar</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500">Somente arquivos PDF são aceitos.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="arquivo"
                  name="arquivo"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {fileData && (
                <button
                  type="button"
                  onClick={(e) => clearFile(e)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600"
                >
                  <X className="w-3 h-3" /> Remover arquivo
                </button>
              )}
            </div>
            {fileError && <p className="text-sm text-red-600">{fileError}</p>}
          </div>

          <div className="flex flex-col gap-3 pt-2 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-gray-500">Ao cadastrar você confirma que o conteúdo segue o padrão ASTI.</p>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700"
            >
              <Check className="w-4 h-4" />
              Cadastrar material
            </button>
          </div>

          {mensagem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-2xl">
                <p className="text-sm text-gray-900">{mensagem}</p>
                <button
                  onClick={() => {
                    setMensagem("");
                    if (mensagem === "Tutorial cadastrado!") {
                      router.push("/asti/area-conhecimento/consultar");
                    }
                  }}
                  className="mt-4 inline-flex items-center justify-center rounded-xl border border-red-200 px-6 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500 hover:text-white"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
