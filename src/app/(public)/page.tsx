import Link from "next/link";
import { Button } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import { MessageSquare, Calendar, BookOpen, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-950 to-brand-900 text-white py-20 px-4">
        <div className="container-page text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Your Mosque,{" "}
            <span className="text-brand-300">Digitally Connected</span>
          </h1>
          <p className="text-lg text-brand-100 mb-8 leading-relaxed">
            Ask Islamic and practical questions, get guidance from qualified
            scholars, and book personal council sessions with the imam — all in
            one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href={ROUTES.ask}>Ask a Question</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white/10">
              <Link href={ROUTES.book}>Book a Session</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container-page">
          <h2 className="text-center text-2xl font-semibold text-gray-900 mb-10">
            How MosqueConnect Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Ask Questions",
                desc: "Submit questions anonymously or from your account. Our team responds promptly.",
                color: "text-blue-600 bg-blue-50",
              },
              {
                icon: BookOpen,
                title: "Browse the FAQ",
                desc: "Search our curated knowledge base before asking — your question may already be answered.",
                color: "text-brand-600 bg-brand-50",
              },
              {
                icon: Calendar,
                title: "Book Council Sessions",
                desc: "Request a private session with the imam for sensitive or personal matters.",
                color: "text-gold-600 bg-gold-50",
              },
              {
                icon: Shield,
                title: "Private & Respectful",
                desc: "Your information is handled with the utmost discretion by the mosque team.",
                color: "text-purple-600 bg-purple-50",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 p-6 bg-white hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex rounded-lg p-3 mb-4 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 bg-gray-50 border-t border-gray-200">
        <div className="container-page text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Ready to connect?
          </h2>
          <p className="text-gray-600 mb-6">
            Create a free account to book sessions, track your questions, and
            receive replies by email.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href={ROUTES.register}>Create Account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.faq}>Browse FAQ</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
