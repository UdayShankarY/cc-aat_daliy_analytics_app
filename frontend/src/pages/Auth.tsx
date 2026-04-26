import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Activity } from "lucide-react";

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});
const signUpSchema = signInSchema.extend({
  displayName: z.string().trim().min(1, "Name required").max(80),
});

const Auth = () => {
  const { user, loading, setAuth } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signInSchema.safeParse(form);
    if (!result.success) {
      toast({ title: "Check your details", description: result.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.login({ email: form.email, password: form.password });
      setAuth(res.token, res.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      toast({ title: "Sign in failed", description: message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    navigate("/dashboard");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signUpSchema.safeParse(form);
    if (!result.success) {
      toast({ title: "Check your details", description: result.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.register({ email: form.email, password: form.password, name: form.displayName });
      setAuth(res.token, res.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      toast({ title: "Sign up failed", description: message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    toast({ title: "Welcome to Pulse!", description: "You're signed in." });
    navigate("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-hero px-4 py-12">
      <Link to="/" className="absolute left-6 top-6 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
          <Activity className="h-5 w-5" />
        </span>
        Pulse
      </Link>

      <Card className="w-full max-w-md animate-scale-in border-border/60 bg-card/95 p-8 shadow-elevated backdrop-blur">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in or create an account to start tracking.</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Name</Label>
                <Input id="signup-name" required maxLength={80} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" autoComplete="new-password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
