import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  Feather, Brain, Sparkles, Sword, FileDown, Share2,
  BookOpen, ChevronRight, Star, Shield, Zap
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center shadow-lg shadow-primary/30">
              <Feather className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif font-bold text-lg text-foreground">Editorial de Élite</span>
          </div>
          <div className="flex items-center gap-3">
            {!loading && (
              isAuthenticated ? (
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="gold-gradient text-primary-foreground font-semibold shadow-lg shadow-primary/20"
                >
                  Ir al panel
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => window.location.href = getLoginUrl()}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    onClick={handleCTA}
                    className="gold-gradient text-primary-foreground font-semibold shadow-lg shadow-primary/20"
                  >
                    Comenzar gratis
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-40 left-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute top-40 right-1/4 w-[300px] h-[300px] rounded-full bg-rose-500/5 blur-3xl" />
        </div>

        <div className="container relative text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma editorial con IA de élite
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Tu obra maestra,{" "}
            <span className="gold-text">perfeccionada</span>{" "}
            por la IA
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Un sistema de agentes editoriales de élite que analiza tu escritura con rigor literario,
            sin condescendencia y con la precisión de un editor profesional.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleCTA}
              className="gold-gradient text-primary-foreground font-semibold text-base px-8 py-6 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-shadow"
            >
              <Feather className="w-5 h-5 mr-2" />
              {isAuthenticated ? "Ir a mis proyectos" : "Comenzar a escribir"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border text-foreground text-base px-8 py-6"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              Ver funcionalidades
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 pt-8 border-t border-border/30">
            {[
              { value: "3", label: "Agentes editoriales IA" },
              { value: "PDF + DOCX", label: "Exportación profesional" },
              { value: "∞", label: "Versiones guardadas" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENTS SECTION */}
      <section id="features" className="py-24 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-4">
              El tribunal editorial más exigente
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tres agentes especializados que analizan tu escritura desde ángulos diferentes,
              sin filtros y con criterio literario de alto nivel.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: "🎭",
                icon: Brain,
                title: "Director Editorial",
                badge: "agent-badge-director",
                description: "Evalúa la estructura narrativa, el potencial editorial y traza la hoja de ruta para llevar tu texto al siguiente nivel. Toma decisiones estratégicas sobre tu obra.",
                traits: ["Estructura narrativa", "Potencial editorial", "Hoja de ruta"],
              },
              {
                emoji: "🔬",
                icon: Sparkles,
                title: "Analista de Voz",
                badge: "agent-badge-analyst",
                description: "Estudia en profundidad tu estilo de escritura: voz narrativa, ritmo, vocabulario, tics lingüísticos y marcas de identidad literaria. Genera tu perfil de autor.",
                traits: ["Voz narrativa", "Ritmo y cadencia", "Perfil de autor"],
              },
              {
                emoji: "⚔️",
                icon: Sword,
                title: "Crítico Literario",
                badge: "agent-badge-critic",
                description: "Crítica dura, honesta y sin condescendencia. Identifica debilidades estructurales, vicios de estilo y te dice la verdad que necesitas escuchar, no la que quieres oír.",
                traits: ["Crítica sin filtros", "Debilidades de estilo", "Veredicto editorial"],
              },
            ].map((agent) => (
              <div key={agent.title} className="glass-card rounded-2xl p-8 flex flex-col">
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-4xl">{agent.emoji}</span>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${agent.badge} mb-2`}>
                      Agente IA
                    </span>
                    <h3 className="font-serif text-xl font-semibold text-foreground">{agent.title}</h3>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6 flex-1">{agent.description}</p>
                <div className="space-y-2">
                  {agent.traits.map((trait) => (
                    <div key={trait} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {trait}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 px-4 border-t border-border/30">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-4">
              Todo lo que necesita un escritor serio
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: BookOpen,
                title: "Editor profesional",
                desc: "Editor de texto enriquecido con formato completo, guardado automático e historial de versiones ilimitado.",
              },
              {
                icon: FileDown,
                title: "Exportación PDF y DOCX",
                desc: "Genera documentos con formato editorial profesional, listos para imprimir o enviar a editoriales.",
              },
              {
                icon: Share2,
                title: "Compartir por WhatsApp",
                desc: "Comparte tus documentos exportados directamente por WhatsApp con un enlace de descarga permanente.",
              },
              {
                icon: Zap,
                title: "Análisis instantáneo",
                desc: "Los agentes analizan tu texto en segundos y guardan el historial completo de feedback para tu proyecto.",
              },
              {
                icon: Shield,
                title: "Versiones seguras",
                desc: "Cada versión de tu documento se guarda en la nube. Nunca perderás tu trabajo.",
              },
              {
                icon: Star,
                title: "Panel de proyectos",
                desc: "Gestiona múltiples proyectos literarios con seguimiento de estado, género y progreso editorial.",
              },
            ].map((feature) => (
              <div key={feature.title} className="glass-card rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-serif font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12 border border-primary/20">
            <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
              <Feather className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-serif text-4xl font-bold text-foreground mb-4">
              ¿Listo para elevar tu escritura?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Únete a la editorial de élite automatizada. Tu obra merece la crítica más honesta
              y las herramientas más profesionales.
            </p>
            <Button
              size="lg"
              onClick={handleCTA}
              className="gold-gradient text-primary-foreground font-semibold text-base px-10 py-6 shadow-xl shadow-primary/25"
            >
              <Feather className="w-5 h-5 mr-2" />
              {isAuthenticated ? "Ir a mis proyectos" : "Comenzar ahora — Es gratis"}
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/30 py-8 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gold-gradient flex items-center justify-center">
              <Feather className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-serif font-semibold text-sm text-foreground">Editorial de Élite</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Plataforma editorial con inteligencia artificial. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
