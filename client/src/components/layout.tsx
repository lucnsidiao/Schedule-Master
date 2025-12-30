import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  Scissors,
  LogOut,
  Menu,
  X,
  Users,
  BarChart3
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Calendar", icon: Calendar, href: "/calendar" },
    { label: "Customers", icon: Users, href: "/customers" },
    { label: "Reports", icon: BarChart3, href: "/reports" },
    { label: "Settings", icon: Settings, href: "/settings" },
    { label: "Services", icon: Scissors, href: "/services" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed lg:sticky top-0 h-screen w-72 bg-white border-r border-slate-200 z-50 transition-transform duration-300 ease-in-out flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Scissors className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight text-slate-900">
              StyleSync
            </h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group",
                  isActive ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}>
                  <item.icon className={clsx("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm border-2 border-white shadow-sm">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="lg:hidden p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold font-display text-slate-900">StyleSync</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
