import { PublicNav } from "@/components/navigation/PublicNav";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 py-6 mt-auto">
        <div className="container-page text-center text-sm text-gray-500">
          © {new Date().getFullYear()} MosqueConnect. Built to serve the community.
        </div>
      </footer>
    </div>
  );
}
