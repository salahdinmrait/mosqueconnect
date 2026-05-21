"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui";
import { ROUTES } from "@/lib/constants";

export function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-700 flex items-center justify-center">
              <span className="text-white text-sm font-bold">MC</span>
            </div>
            <span className="font-semibold text-gray-900">MosqueConnect</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href={ROUTES.faq} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              FAQ
            </Link>
            <Link href={ROUTES.ask} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Ask a Question
            </Link>
            <Link href={ROUTES.book} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Book a Session
            </Link>
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.login}>Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={ROUTES.register}>Register</Link>
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 space-y-1 border-t border-gray-100 pt-3">
            {[
              { href: ROUTES.faq, label: "FAQ" },
              { href: ROUTES.ask, label: "Ask a Question" },
              { href: ROUTES.book, label: "Book a Session" },
              { href: ROUTES.login, label: "Sign in" },
              { href: ROUTES.register, label: "Register" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
