import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { useAgentStream } from "@/hooks/useAgentStream";

interface AgentPanelProps {
  projectId: string;
  documentId: string;
}

export function AgentPanel({ projectId, documentId }: AgentPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const { data, isLoading, error, startStream } = useAgentStream(
    `/api/stream/agent`
  );

  const handleAgentSelect = async (agentType: string) => {
    setSelectedAgent(agentType);
    setIsOpen(true);
    
    await startStream({
      projectId,
      documentId,
      agentType,
    });
  };

  return (
    <>
      {/* Desktop - Sidebar fija */}
      <aside className="hidden lg:block w-80 border-r bg-muted/10 p-6">
        <h3 className="font-semibold mb-4">Agentes de Análisis</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleAgentSelect("director")}
            disabled={isLoading}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Director Editorial
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleAgentSelect("voice_analyst")}
            disabled={isLoading}          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Analista de Voz
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleAgentSelect("critic")}
            disabled={isLoading}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Crítico Literario
          </Button>
        </div>

        {isLoading && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin mb-2" />
            <p className="text-sm text-muted-foreground">Analizando...</p>
          </div>
        )}

        {data && (
          <div className="mt-6 p-4 bg-card rounded-lg border">
            <p className="text-sm whitespace-pre-wrap">{data}</p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-destructive/10 rounded-lg border border-destructive">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </aside>

      {/* Móvil - Bottom Sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              className="w-full rounded-t-lg"
              onClick={() => handleAgentSelect("director")}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {isLoading ? "Analizando..." : "Analizar con IA"}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <h3 className="font-semibold">Resultado del Análisis</h3>              
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p>La IA está trabajando...</p>
                </div>
              )}

              {data && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{data}</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
    }
