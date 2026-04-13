import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { EditorToolbar } from "@/components/EditorToolbar";
import { AgentPanel } from "@/components/AgentPanel";
import { useEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

export function Editor() {
  const { projectId } = useParams<{ projectId: string }>();
  const { content, isLoading, error, saveDocument } = useEditor(projectId);
  const [localContent, setLocalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // CORRECCIÓN CRÍTICA: Referencia al timer para poder limpiarlo
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar contenido local con el del hook
  useEffect(() => {
    if (content) {
      setLocalContent(content);
    }
  }, [content]);

  // CORRECCIÓN: Autosave con cleanup apropiado
  useEffect(() => {
    if (!localContent || !projectId) return;

    // Limpiar timer anterior si existe
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Configurar nuevo timer
    autosaveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveDocument(localContent);
        setLastSaved(new Date());
      } catch (err) {
        console.error("Autosave failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 30000); // Guardar cada 30 segundos

    // CORRECCIÓN: Cleanup function que elimina el timer
    return () => {
      if (autosaveTimerRef.current) {        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [localContent, projectId, saveDocument]);

  const handleChange = (value: string) => {
    setLocalContent(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Área principal de edición */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <EditorToolbar 
          onSave={() => saveDocument(localContent)}
          isSaving={isSaving}
          lastSaved={lastSaved}
        />
        
        <div className="flex-1 overflow-auto p-8">
          <textarea
            value={localContent}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full h-full resize-none outline-none text-lg leading-relaxed font-serif"
            placeholder="Empieza a escribir tu historia..."
          />
        </div>

        {/* Padding extra en móvil para que el contenido no quede oculto */}
        <div className="lg:hidden h-20" />
      </div>
      {/* Panel de Agentes IA */}
      <AgentPanel 
        projectId={projectId!}
        documentId="current"
      />
    </div>
  );
}
