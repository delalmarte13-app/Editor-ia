import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { EditorToolbar } from "@/components/EditorToolbar";
import { AgentPanel } from "@/components/components/AgentPanel";
import { useEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Editor() {
  const [, params] = useRoute("/editor/:projectId");
  const projectId = params?.projectId;
  
  const { content, isLoading, error, saveDocument, isSaving: isMutationSaving } = useEditor(projectId);
  const [localContent, setLocalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (content !== undefined) {
      setLocalContent(content);
    }
  }, [content]);

  useEffect(() => {
    if (!localContent || !projectId) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

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
    }, 30000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [localContent, projectId, saveDocument]);

  const handleChange = (value: string) => {
    setLocalContent(value);
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      await saveDocument(localContent);
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
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
        <p className="text-destructive mb-4">{String(error)}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <EditorToolbar 
          onSave={handleManualSave}
          isSaving={isSaving || isMutationSaving}
          lastSaved={lastSaved}
        />
        
        <div className="flex-1 overflow-auto p-8">
          <textarea
            value={localContent}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full h-full resize-none outline-none text-lg leading-relaxed font-serif bg-transparent"
            placeholder="Empieza a escribir tu historia..."
          />
        </div>

        <div className="lg:hidden h-20" />
      </div>
      <AgentPanel 
        projectId={projectId!}
        documentId="current"
      />
    </div>
  );
}
