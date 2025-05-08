"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface UserSession {
  id: string;
  name?: string;
  email: string;
  role?: string;
}

interface SessionData {
  user: UserSession | null;
}

const fetchSession = async (): Promise<SessionData | null> => {
  try {
    const res = await fetch("/api/auth/session");
    if (res.ok) {
      const data = await res.json();
      return data.user ? { user: data.user } : { user: null };
    }
    return { user: null };
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return { user: null };
  }
};

const handleSignOut = async (router: ReturnType<typeof useRouter>) => {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  } catch (error) {
    console.error("Failed to sign out:", error);
  }
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      const sessionData = await fetchSession();
      if (!sessionData?.user) {
        router.push("/login");
      } else {
        setSession(sessionData);
      }
      setIsLoading(false);
    };
    loadSession();
  }, [router]);

  if (isLoading || !session?.user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard Home" },
    { href: "/dashboard/students", label: "Students" },
    { href: "/dashboard/subjects", label: "Subjects" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 text-black">
      <aside className="w-64 bg-gray-800 text-white p-6 space-y-6">
        <div className="text-2xl font-semibold">Dashboard</div>
        <nav className="space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors ${
                pathname === link.href ? "bg-blue-600 font-semibold" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-700">
          <button
            onClick={() => handleSignOut(router)}
            className="w-full text-left px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-red-300 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white p-6 rounded-lg shadow-md min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}