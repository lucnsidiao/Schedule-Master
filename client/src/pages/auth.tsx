import { useLogin, useRegister } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Scissors, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const login = useLogin();
  const register = useRegister();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      if (isLogin) {
        await login.mutateAsync({
          username: data.username as string,
          password: data.password as string,
        });
      } else {
        await register.mutateAsync({
          name: data.name as string,
          email: data.email as string,
          password: data.password as string,
          businessName: data.businessName as string,
        });
      }
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const isPending = login.isPending || register.isPending;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90" />
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80')", backgroundSize: 'cover', mixBlendMode: 'overlay', opacity: 0.2 }} />

        <div className="relative z-10 max-w-lg text-center space-y-6">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/20 shadow-2xl">
            <Scissors className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold font-display tracking-tight leading-tight">
            Manage your appointments with style.
          </h1>
          <p className="text-xl text-indigo-100 font-light">
            The all-in-one platform for salons, barbershops, and spas to grow their business.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold font-display text-slate-900">StyleSync</h1>
          </div>

          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-md">
            <CardHeader className="space-y-1 text-center pb-8">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {isLogin ? "Welcome back" : "Create an account"}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? "Enter your credentials to access your dashboard"
                  : "Enter your details to get started with StyleSync"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" placeholder="John Doe" required className="glass-input" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="john@example.com" required className="glass-input" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input id="businessName" name="businessName" placeholder="Luxe Salon" required className="glass-input" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>


                {isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" placeholder="johndoe" required className="glass-input" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required className="glass-input" />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all duration-200"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
