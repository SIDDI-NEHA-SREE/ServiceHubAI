import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { KBDocument } from '../../types';
import { BookOpen, Upload, Link as LinkIcon, FileText, Trash2, Bot, Send, Sparkles, CheckCircle2, FileCode, Layers, ExternalLink, Loader2 } from 'lucide-react';

interface Citation {
  doc_id: string;
  doc_title: string;
  chunk_index: number;
  content_snippet: string;
}

interface RAGResponse {
  answer: string;
  sources: Citation[];
  confidence_score: number;
}

export const KnowledgeBaseView: React.FC = () => {
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // Upload Form state
  const [file, setFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // RAG Chatbot state
  const [question, setQuestion] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [ragResult, setRagResult] = useState<RAGResponse | null>(null);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await api.get('/kb/documents');
      setDocuments(res.data || []);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/kb/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFile(null);
      setUploadSuccess(true);
      fetchDocuments();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch {
      alert('Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsUploading(true);
    try {
      await api.post('/kb/add-link', { url: urlInput });
      setUrlInput('');
      setUploadSuccess(true);
      fetchDocuments();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch {
      alert('Failed to index URL content.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this indexed document?')) return;
    try {
      await api.delete(`/kb/documents/${id}`);
      fetchDocuments();
    } catch {
      alert('Failed to delete document.');
    }
  };

  const handleRAGQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsQuerying(true);
    setRagResult(null);

    try {
      const res = await api.post<RAGResponse>('/kb/query', { question });
      setRagResult(res.data);
    } catch {
      setRagResult({
        answer: 'Failed to complete RAG query. Please ensure backend services are running.',
        sources: [],
        confidence_score: 0.0
      });
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Multi-Tenant RAG Knowledge Engine</span>
          </div>
          <h1 className="text-3xl font-black font-heading text-white">AI Knowledge Base</h1>
          <p className="text-sm text-slate-400">Upload organization documents (PDF, DOCX, XLSX, CSV, Links) to power strict tenant RAG answers.</p>
        </div>
      </div>

      {/* Main Grid: Upload & Doc Table (Left) + Interactive RAG QA Widget (Right) */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Side: Upload Zone & Document Manager */}
        <div className="space-y-6">
          {/* File Upload Box */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" /> Upload Organization Document
            </h3>

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Document uploaded, chunked & indexed successfully!
              </div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-3">
              <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/40 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md"
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-200">
                    {file ? file.name : 'Click or drag PDF, DOCX, XLSX, CSV file'}
                  </p>
                  <p className="text-[11px] text-slate-500">Supports PDF, DOCX, Excel, CSV, Text (Max 25MB)</p>
                </label>
              </div>

              <button
                type="submit"
                disabled={!file || isUploading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Chunking & Indexing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Index File in Vector Store
                  </>
                )}
              </button>
            </form>

            {/* URL Indexing Form */}
            <form onSubmit={handleAddLink} className="pt-2 border-t border-slate-800/80 flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://company-policy-docs.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={!urlInput.trim() || isUploading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
              >
                Index Link
              </button>
            </form>
          </div>

          {/* Indexed Documents Table */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold font-heading text-white">Indexed Tenant Documents</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Chunks</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white max-w-xs truncate">{doc.title}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono uppercase font-bold text-[10px]">
                          {doc.file_type}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{doc.chunk_count} chunks</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          INDEXED
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive RAG QA Bot Widget */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-white">Gemini RAG Document Assistant</h3>
                  <p className="text-xs text-slate-400">Ask questions answered strictly using indexed company files.</p>
                </div>
              </div>

              <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                RAG Active
              </span>
            </div>

            {/* Answer Box */}
            {ragResult && (
              <div className="space-y-4 p-5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> AI Answer
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Confidence: {Math.round(ragResult.confidence_score * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{ragResult.answer}</p>
                </div>

                {/* Source Citations */}
                {ragResult.sources && ragResult.sources.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                      Verified Document Citations
                    </span>
                    <div className="space-y-2">
                      {ragResult.sources.map((s, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-indigo-400" /> {s.doc_title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">Chunk #{s.chunk_index}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 italic">"{s.content_snippet}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RAG Query Input Form */}
          <form onSubmit={handleRAGQuery} className="space-y-3 pt-4 border-t border-slate-800">
            <div className="relative">
              <input
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question (e.g. 'What is our hardware upgrade policy?')..."
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isQuerying || !question.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50"
              >
                {isQuerying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
