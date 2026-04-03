import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Streamdown } from "streamdown";
import {
  Feather, Bold, Italic, UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Quote, Undo, Redo, Save, Download, ArrowLeft,
  Sparkles, Brain, Sword, ChevronDown, ChevronUp,
  Loader2, History, FileText, MessageSquare, Highlighter
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AgentType = "director" | "voice_analyst" | "critic";

const AGENT_CONFIG = {
  director: {
    label: "Director Editorial",
    icon: Brain,
    badge: "agent-badge-director",
    color: "text-blue-400",
    emoji: "🎭",
  },
  voice_analyst: {
    label: "Analista de Voz",
    icon: Sparkles,
    badge: "agent-badge-analyst",
    color: "text-emerald-400",
    emoji: "🔬",
  },
  critic: {
    label: "Crítico Literario",
    icon: Sword,
    badge: "agent-badge-critic",
    color: "text-rose-400",
    emoji: "⚔️",
  },
};

export default function Editor() {
  const { isAuthenticated } = useAuth();
  const params = useParams<{ projectId?: string }>();
  const [, navigate] = useLocation();

  const projectId = params.projectId ? parseInt(params.projectId) : null;

  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null);
  const [agentResponse, setAgentResponse] = useState<string>("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exportLoading, setExportLoading] = useState<"pdf" | "docx" | null>(null);

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const { data: project } = trpc.projects.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  const { data: latestVersion } = trpc.documents.getLatest.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: analyses, refetch: refetchAnalyses } = trpc.agents.listAnalyses.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: versions } = trpc.documents.listVersions.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId && showHistory }
  );

  const saveVersion = trpc.documents.saveVersion.useMutation({
    onSuccess: () => setIsSaving(false),
    onError: () => { setIsSaving(false); toast.error("Error al guardar"); },
  });

  const runAgent = trpc.agents.run.useMutation({
    onSuccess: (data) => {
      setAgentResponse(data.response);
      setAgentLoading(false);
      refetchAnalyses();
      toast.success(`${AGENT_CONFIG[activeAgent!].label} ha completado el análisis`);
    },
    onError: () => {
      setAgentLoading(false);
      toast.error("Error al ejecutar el agente");
    },
  });

  const exportDoc = trpc.exports.generate.useMutation({
    onSuccess: (data) => {
      setExportLoading(null);
      toast.success(`Documento ${data.format.toUpperCase()} generado`);
      window.open(data.fileUrl, "_blank");
    },
    onError: () => {
      setExportLoading(null);
      toast.error("Error al generar el documento");
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "Comienza a escribir tu obra maestra...\n\nEl cursor parpadea. La página en blanco espera. Es el momento.",
      }),
      CharacterCount,
    ],
    content: "",
    editorProps: {
      attributes: { class: "editor-content focus:outline-none" },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      // Autosave
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
      autosaveRef.current = setTimeout(() => {
        if (projectId && editor.getHTML().length > 10) {
          setIsSaving(true);
          saveVersion.mutate({
            projectId,
            content: editor.getHTML(),
            wordCount: words,
            charCount: text.length,
            isAutosave: true,
          });
        }
      }, 3000);
    },
  });

  // Cargar contenido inicial
  useEffect(() => {
    if (editor && latestVersion?.content && editor.isEmpty) {
      editor.commands.setContent(latestVersion.content);
    }
  }, [editor, latestVersion]);

  const handleSaveManual = useCallback(() => {
    if (!editor || !projectId) return;
    setIsSaving(true);
    const text = editor.getText();
    saveVersion.mutate({
      projectId,
      content: editor.getHTML(),
      wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
      charCount: text.length,
      isAutosave: false,
      versionLabel: `v${new Date().toLocaleString("es-ES")}`,
    });
    toast.success("Versión guardada");
  }, [editor, projectId]);

  const handleRunAgent = (agentType: AgentType) => {
    if (!editor || !projectId) { toast.error("Necesitas un proyecto activo"); return; }
    const content = editor.getText();
    if (content.trim().length < 50) { toast.error("Escribe al menos 50 caracteres antes de analizar"); return; }
    setActiveAgent(agentType);
    setAgentResponse("");
    setAgentLoading(true);
    runAgent.mutate({ projectId, agentType, content: editor.getHTML() });
  };

  const handleExport = (format: "pdf" | "docx") => {
    if (!editor || !projectId) return;
    setExportLoading(format);
    exportDoc.mutate({
      projectId,
      content: editor.getHTML(),
      title: project?.title ?? "Documento",
      format,
    });
  };

  const handleWhatsApp = (url: string) => {
    const msg = encodeURIComponent(`Te comparto mi documento: ${url}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  if (!editor) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* TOP BAR */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Panel
          </Button>

          <div className="w-px h-5 bg-border" />

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded gold-gradient flex items-center justify-center flex-shrink-0">
              <Feather className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-serif font-semibold text-foreground truncate">
              {project?.title ?? "Nuevo documento"}
            </span>
            {project?.genre && (
              <Badge variant="outline" className="border-border text-muted-foreground text-xs hidden sm:flex">
                {project.genre}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Contador */}
            <span className="text-xs text-muted-foreground hidden sm:block">
              {wordCount.toLocaleString()} palabras
            </span>

            {/* Estado guardado */}
            {isSaving ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
              </span>
            ) : (
              <span className="text-xs text-emerald-400 hidden sm:block">Guardado</span>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveManual}
              className="text-muted-foreground hover:text-foreground"
            >
              <Save className="w-4 h-4" />
            </Button>

            {/* Exportar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-border text-foreground" disabled={!!exportLoading}>
                  {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span className="hidden sm:inline ml-1">Exportar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover border-border">
                <DropdownMenuItem onClick={() => handleExport("pdf")} className="text-foreground cursor-pointer">
                  <FileText className="w-4 h-4 mr-2 text-rose-400" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("docx")} className="text-foreground cursor-pointer">
                  <FileText className="w-4 h-4 mr-2 text-blue-400" />
                  Exportar DOCX
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* TOOLBAR FORMATO */}
        <div className="flex items-center gap-0.5 px-4 pb-2 overflow-x-auto scrollbar-thin">
          {/* Headings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground h-8 px-2 text-xs">
                Párrafo <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border">
              {[
                { label: "Párrafo", action: () => editor.chain().focus().setParagraph().run() },
                { label: "Título 1", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
                { label: "Título 2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
                { label: "Título 3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
              ].map((h) => (
                <DropdownMenuItem key={h.label} onClick={h.action} className="text-foreground cursor-pointer text-sm">
                  {h.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 bg-border mx-1" />

          {[
            { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold"), title: "Negrita" },
            { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic"), title: "Cursiva" },
            { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline"), title: "Subrayado" },
            { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike"), title: "Tachado" },
            { icon: Highlighter, action: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive("highlight"), title: "Resaltar" },
          ].map((btn) => (
            <Button
              key={btn.title}
              variant="ghost"
              size="sm"
              onClick={btn.action}
              title={btn.title}
              className={`h-8 w-8 p-0 ${btn.active ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
            >
              <btn.icon className="w-3.5 h-3.5" />
            </Button>
          ))}

          <div className="w-px h-5 bg-border mx-1" />

          {[
            { icon: AlignLeft, action: () => editor.chain().focus().setTextAlign("left").run(), active: editor.isActive({ textAlign: "left" }), title: "Izquierda" },
            { icon: AlignCenter, action: () => editor.chain().focus().setTextAlign("center").run(), active: editor.isActive({ textAlign: "center" }), title: "Centro" },
            { icon: AlignRight, action: () => editor.chain().focus().setTextAlign("right").run(), active: editor.isActive({ textAlign: "right" }), title: "Derecha" },
          ].map((btn) => (
            <Button
              key={btn.title}
              variant="ghost"
              size="sm"
              onClick={btn.action}
              title={btn.title}
              className={`h-8 w-8 p-0 ${btn.active ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
            >
              <btn.icon className="w-3.5 h-3.5" />
            </Button>
          ))}

          <div className="w-px h-5 bg-border mx-1" />

          {[
            { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList"), title: "Lista" },
            { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList"), title: "Lista numerada" },
            { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote"), title: "Cita" },
          ].map((btn) => (
            <Button
              key={btn.title}
              variant="ghost"
              size="sm"
              onClick={btn.action}
              title={btn.title}
              className={`h-8 w-8 p-0 ${btn.active ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
            >
              <btn.icon className="w-3.5 h-3.5" />
            </Button>
          ))}

          <div className="w-px h-5 bg-border mx-1" />

          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} className="h-8 w-8 p-0 text-muted-foreground" title="Deshacer">
            <Undo className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} className="h-8 w-8 p-0 text-muted-foreground" title="Rehacer">
            <Redo className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* EDITOR AREA */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-3xl mx-auto px-6 py-12">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* PANEL DERECHO — AGENTES */}
        <aside className="w-full max-w-sm border-l border-border/50 bg-card/50 flex flex-col hidden lg:flex">
          <Tabs defaultValue="agents" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="mx-4 mt-4 bg-muted/30 border border-border/50">
              <TabsTrigger value="agents" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Sparkles className="w-3 h-3 mr-1" /> Agentes
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <History className="w-3 h-3 mr-1" /> Historial
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MessageSquare className="w-3 h-3 mr-1" /> Análisis
              </TabsTrigger>
            </TabsList>

            {/* AGENTES TAB */}
            <TabsContent value="agents" className="flex-1 overflow-hidden flex flex-col px-4 pb-4">
              <p className="text-xs text-muted-foreground mt-3 mb-4">
                Selecciona un agente para analizar tu texto actual.
              </p>

              <div className="space-y-2 mb-4">
                {(Object.entries(AGENT_CONFIG) as [AgentType, typeof AGENT_CONFIG[AgentType]][]).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => handleRunAgent(type)}
                    disabled={agentLoading}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200 ${
                      activeAgent === type && agentLoading
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="text-xl">{config.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{config.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {type === "director" && "Coordina y evalúa la estructura"}
                        {type === "voice_analyst" && "Analiza tu estilo y voz narrativa"}
                        {type === "critic" && "Crítica dura y sin condescendencia"}
                      </p>
                    </div>
                    {activeAgent === type && agentLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 rotate-90" />
                    )}
                  </button>
                ))}
              </div>

              {/* Respuesta del agente */}
              {(agentLoading || agentResponse) && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  {activeAgent && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${AGENT_CONFIG[activeAgent].badge}`}>
                        {AGENT_CONFIG[activeAgent].emoji} {AGENT_CONFIG[activeAgent].label}
                      </span>
                    </div>
                  )}
                  <ScrollArea className="flex-1 rounded-lg border border-border/50 bg-card p-3">
                    {agentLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analizando tu texto...
                      </div>
                    ) : (
                      <div className="text-sm text-foreground leading-relaxed prose-sm">
                        <Streamdown>{agentResponse}</Streamdown>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </TabsContent>

            {/* HISTORIAL TAB */}
            <TabsContent value="history" className="flex-1 overflow-hidden flex flex-col px-4 pb-4">
              <p className="text-xs text-muted-foreground mt-3 mb-4">Versiones guardadas de tu documento.</p>
              <ScrollArea className="flex-1">
                {!versions || versions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Sin versiones guardadas
                  </div>
                ) : (
                  <div className="space-y-2">
                    {versions.map((v: NonNullable<typeof versions>[number]) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-lg border border-border/50 bg-card cursor-pointer hover:border-primary/30 transition-colors"
                        onClick={() => {
                          editor.commands.setContent(v.content);
                          toast.info("Versión restaurada");
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">
                            {v.versionLabel ?? (v.isAutosave ? "Autoguardado" : "Manual")}
                          </span>
                          {v.isAutosave && (
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground">Auto</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(v.createdAt).toLocaleString("es-ES")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {v.wordCount?.toLocaleString()} palabras
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* ANÁLISIS TAB */}
            <TabsContent value="feedback" className="flex-1 overflow-hidden flex flex-col px-4 pb-4">
              <p className="text-xs text-muted-foreground mt-3 mb-4">Análisis previos de los agentes.</p>
              <ScrollArea className="flex-1">
                {!analyses || analyses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Sin análisis todavía
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analyses.map((a: NonNullable<typeof analyses>[number]) => {
                      const config = AGENT_CONFIG[a.agentType as AgentType];
                      return (
                        <div key={a.id} className="p-3 rounded-lg border border-border/50 bg-card">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config?.badge ?? ""}`}>
                              {config?.emoji} {config?.label ?? a.agentType}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {new Date(a.createdAt).toLocaleString("es-ES")}
                          </p>
                          <div className="text-xs text-foreground leading-relaxed line-clamp-4">
                            <Streamdown>{a.response.slice(0, 300) + (a.response.length > 300 ? "..." : "")}</Streamdown>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* MOBILE AGENT BUTTONS */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/95 backdrop-blur-sm p-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          {(Object.entries(AGENT_CONFIG) as [AgentType, typeof AGENT_CONFIG[AgentType]][]).map(([type, config]) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => handleRunAgent(type)}
              disabled={agentLoading}
              className="border-border text-foreground flex-shrink-0 text-xs"
            >
              {agentLoading && activeAgent === type ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <span className="mr-1">{config.emoji}</span>
              )}
              {config.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
