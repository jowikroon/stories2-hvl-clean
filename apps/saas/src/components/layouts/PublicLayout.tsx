import { Outlet, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const navLinks = [
  { label: "Product", to: "/product" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
];

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Announcement Bar */}
      <div className="bg-primary/10 border-b border-primary/20 text-center py-2 px-4 text-sm">
        <span className="inline-flex items-center gap-1.5 text-primary font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          New: AI-powered bulk content generation
          <Link
            to="/product"
            className="underline underline-offset-2 hover:text-primary/80 ml-1"
          >
            Learn more →
          </Link>
        </span>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="text-lg font-bold tracking-tight">
            marketplace<span className="text-gradient">growth</span>.nl
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link to="/auth?tab=signup" className="hidden sm:inline-flex">
              <Button size="sm" className="gap-1.5 font-semibold">
                Start Free Trial
              </Button>
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-muted-foreground"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <div className="container mx-auto px-6 py-4 flex flex-col gap-3">
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-muted-foreground hover:text-foreground py-2"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="flex gap-3 pt-2 border-t border-border">
                  <Link to="/auth" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/auth?tab=signup" className="flex-1">
                    <Button size="sm" className="w-full font-semibold">
                      Start Free Trial
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Page content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            © 2026 marketplacegrowth.nl — All rights reserved.
          </span>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              to="/security"
              className="hover:text-foreground transition-colors"
            >
              Security
            </Link>
            <Link
              to="/docs"
              className="hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              to="/contact"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
