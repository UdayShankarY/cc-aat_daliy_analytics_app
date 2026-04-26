import { Link, Navigate } from "react-router-dom";
import { Activity, BarChart3, Sparkles, Lock, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TRACKERS, TRACKER_TYPES } from "@/lib/trackers";

const Index = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Activity className="h-5 w-5" />
          </span>
          Pulse
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
          <Button variant="hero" asChild><Link to="/auth">Get started</Link></Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Daily life analytics, made simple
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-tight md:text-6xl">
              Track your day.{" "}
              <span className="text-gradient">Understand yourself.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Log expenses, sleep, study, and exercise in seconds. Pulse turns your daily habits into beautiful charts and gentle insights.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth">Start tracking free</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>
          </div>

          {/* Tracker pills */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
            {TRACKER_TYPES.map((t) => {
              const cfg = TRACKERS[t];
              return (
                <Card key={t} className="flex flex-col items-center p-5 shadow-soft transition-transform hover:-translate-y-1">
                  <span className="text-3xl">{cfg.emoji}</span>
                  <span className="mt-2 font-medium">{cfg.label}</span>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Features */}
        <section className="container pb-20">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: BarChart3, title: "Beautiful charts", desc: "Daily and weekly views with trends and category breakdowns." },
              { icon: Sparkles, title: "Gentle insights", desc: "Notice when sleep drops or spending creeps up — automatically." },
              { icon: Download, title: "Own your data", desc: "Export everything to CSV anytime. No vendor lock-in." },
              { icon: Lock, title: "Private by default", desc: "Your data is encrypted and only visible to you." },
              { icon: Activity, title: "4 trackers", desc: "Expenses, sleep, study and exercise — all in one place." },
              { icon: Sparkles, title: "Built for you", desc: "Add an entry in under 10 seconds. No clutter, no ads." },
            ].map((f) => (
              <Card key={f.title} className="p-6 shadow-soft">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container pb-24">
          <Card className="overflow-hidden border-primary/20 bg-gradient-primary p-10 text-center text-primary-foreground shadow-glow">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Start your first day of tracking</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
              Free to use. Sign up in seconds and add your first entry.
            </p>
            <Button size="lg" variant="secondary" className="mt-6" asChild>
              <Link to="/auth">Create your account</Link>
            </Button>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        Pulse · Daily Life Analytics
      </footer>
    </div>
  );
};

export default Index;
