"use client";
import { useState, useRef } from "react";
import { Check, FolderOpen, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FormsCadastro() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    tipo: null as number | null,
    descricao: ""
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
      descricao: string;
      anexo?: AnexoPayload;
    };

    const payload: Payload = { ...form };
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
      setForm({ nome: "", tipo: null, descricao: "" });
      setFileData(null);
    } else {
      setMensagem(result.erro || "Falha ao cadastrar.");
    }
  }

  return (
    <div className="flex justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-5 border border-gray-100 rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Formulário de Cadastro</h2>

        <div>
          <label htmlFor="nome" className="block text-sm font-medium mb-1">
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
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="tipo" className="block text-sm font-medium mb-1">
            Tipo do Material
          </label>
          <select
            id="tipo"
            name="tipo"
            value={form.tipo === null ? "" : form.tipo}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">Selecione o tipo</option>
            <option value={0}>Tutorial</option>
            <option value={1}>Pop</option>
          </select>
        </div>

        <div>
          <label htmlFor="descricao" className="block text-sm font-medium mb-1">
            Descrição
          </label>
          <textarea
            id="descricao"
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Descrição"
            required
            rows={4}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
          />
        </div>

      <div>
            <label className="block text-sm font-medium mb-1">Arquivo</label>
            <div className="w-full flex items-center px-4 py-2 border rounded-md cursor-pointer focus-within:ring-2 focus-within:ring-emerald-500 bg-white">
      <label htmlFor="arquivo" className="flex items-center w-full cursor-pointer relative">
        <FolderOpen className="w-5 h-5 text-emerald-800 mr-2" />
        <span className="text-sm text-gray-700 flex-1">
          {fileData ? `Arquivo selecionado: ${fileData.name}` : "Escolher arquivo"}
        </span>
        {fileData && (
          <button
            type="button"
            onClick={(e) => clearFile(e)}
            aria-label="Remover arquivo"
            className="ml-2 text-red-600 bg-red-100 rounded-full w-6 h-6 flex items-center justify-center text-xs"
          >
            <X className="w-3 h-3" />
          </button>
        )}
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
    </div>
    {fileError && <div className="text-sm text-red-600 mt-2">{fileError}</div>}
        </div>


        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2 bg-white-200 text-emerald-800 border font-medium rounded-md shadow hover:bg-emerald-500/15  transition "
          >
            <Check className="w-4 h-4" />
            Cadastrar
          </button>
        </div>

        

{mensagem && (
  <>
    <div 
      className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50" 
      style={{ marginTop: 0, paddingTop: 0 }}
    >
      <div className="bg-white p-6 rounded-md shadow-lg max-w-xs w-full justify-center items-center text-center">
        <p className="text-sm text-gray-900">{mensagem}</p>
        <button
          onClick={() => {
            setMensagem("");
            if (mensagem === "Tutorial cadastrado!") {
              router.push("/asti/area-conhecimento/consultar");
            }
          }}
          className="mt-4 px-6 py-2 bg-white-300 text-red-600 rounded-sm border border-gray-200 shadow-md transition-transform duration-200 hover:bg-red-500 hover:text-white"
        >
          Fechar
        </button>
      </div>
    </div>
  </>
)}


      </form>
    </div>
  );
}
