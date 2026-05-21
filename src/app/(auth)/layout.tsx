import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="h-9 w-9 rounded-lg bg-brand-700 flex items-center justify-center">
          <span className="text-white font-bold">MC</span>
        </div>
        <span className="text-xl font-semibold text-gray-900">MosqueConnect</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
