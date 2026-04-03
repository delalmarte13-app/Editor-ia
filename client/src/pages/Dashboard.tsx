import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  Feather, Plus, BookOpen, Clock, CheckCircle2, Archive,
  BarChart3, Sparkles, LogOut, User
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const STATUS_CONFIG = {
  draft: { label: "Borrador", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  in_review: { label: "En revisión", icon: Sparkles, color: "text-blue-400", bg: "bg-blue-400/10" },
  completed: { label: "Completado", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  archived: { label: "Archivado", icon: Archive, color: "text-muted-foreground", bg: "bg-muted/30" },
};

const GENRES = [
  "Novela", "Cuento", "Poesía", "Ensayo", "Crónica", "Guión",
  "Artículo", "Memorias", "Thriller", "Fantasía", "Ciencia Ficción", "Otro"
];

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [newDesc, setNewDesc] = useState("");

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const createProject = trpc.projects.create.useMutation({
    onSuccess: (p) => {
      toast.success("Proyecto creado");
      setShowCreate(false);
      setNewTitle(""); setNewGenre(""); setNewDesc("");
      navigate(`/editor/${p.id}`);
    },
    onError: () => toast.error("Error al crear el proyecto"),
  });

  const handleCreate = () => {
    if (!newTitle.trim()) { toast.error("El título es obligatorio"); return; }
    createProject.mutate({ title: newTitle, genre: newGenre, description: newDesc });
  };

  const stats = {
    total: projects?.length ?? 0,
    draft: projects?.filter((p) => p.status === "draft").length ?? 0,
    inReview: projects?.filter((p) => p.status === "in_review").length ?? 0,
    completed: projects?.filter((p) => p.status === "completed").length ?? 0,
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border/50 bg-sidebar p-6 fixed h-full">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <Feather className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-serif font-bold text-sidebar-foreground">Editorial de Élite</span>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { icon: BarChart3, label: "Panel", path: "/dashboard", active: true },
            { icon: BookOpen, label: "Proyectos", path: "/projects" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-sidebar-border pt-4 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "Usuario"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 lg:ml-64 p-6 lg:p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              Bienvenido, {user?.name?.split(" ")[0] ?? "escritor"}
            </h1>
            <p className="text-muted-foreground mt-1">Tu estudio editorial personal</p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="gold-gradient text-primary-foreground font-semibold shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo proyecto
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total", value: stats.total, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
            { label: "Borradores", value: stats.draft, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10" },
            { label: "En revisión", value: stats.inReview, icon: Sparkles, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "Completados", value: stats.completed, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-5">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-serif font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-foreground mb-5">Proyectos recientes</h2>

          {isLoading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              ))}
            </div>
          ) : projects?.length === 0 ? (
            <div className="glass-card rounded-xl p-16 text-center">
              <Feather className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Sin proyectos todavía</h3>
              <p className="text-muted-foreground mb-6">Crea tu primer proyecto literario y comienza a escribir.</p>
              <Button onClick={() => setShowCreate(true)} className="gold-gradient text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Crear primer proyecto
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects?.map((project: NonNullable<typeof projects>[number]) => {
                const status = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG];
                const StatusIcon = status.icon;
                return (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/editor/${project.id}`)}
                    className="glass-card rounded-xl p-6 cursor-pointer hover:border-primary/30 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      {project.genre && (
                        <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                          {project.genre}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(project.updatedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* DIALOG CREAR PROYECTO */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Nuevo proyecto literario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-foreground mb-1.5 block">Título *</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="El nombre de tu obra..."
                className="bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground mb-1.5 block">Género literario</Label>
              <Select value={newGenre} onValueChange={setNewGenre}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Selecciona un género..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g} className="text-foreground">{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground mb-1.5 block">Descripción</Label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Una breve sinopsis o nota sobre el proyecto..."
                className="bg-input border-border text-foreground resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-border text-foreground">
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createProject.isPending}
              className="gold-gradient text-primary-foreground"
            >
              {createProject.isPending ? "Creando..." : "Crear proyecto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
