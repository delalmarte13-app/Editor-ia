import { Button } from "@/components/ui/button";
import { Save, Loader2, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

interface EditorToolbarProps {
  onSave: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
}

export function EditorToolbar({ onSave, isSaving, lastSaved }: EditorToolbarProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-sm lg:text-base truncate max-w-[200px] lg:max-w-md">
          Editor Editorial
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {lastSaved && (
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Guardado a las {lastSaved.toLocaleTimeString()}
          </span>
        )}
        <Button 
          size="sm" 
          onClick={onSave} 
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Guardar</span>
        </Button>
      </div>
    </div>
  );
}
