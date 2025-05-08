"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

// Define a type for the session user if not already globally available
interface UserSession {
  id: string;
  name?: string;
  email: string;
  role?: string;
  // Add any other properties your user object might have
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
    return { user: null }; // Or handle error appropriately
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return { user: null }; // Or handle error appropriately
  }
};

export default function NewSubjectPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    credits: 1, // Default to 1 credit
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "credits" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to create subject");
      }

      toast.success("Subject created successfully");
      router.push("/dashboard/subjects");
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to create subject");
      } else {
        toast.error("An unknown error occurred");
      }
      console.error("Error creating subject:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      setIsLoadingSession(true);
      const sessionData = await fetchSession();
      setSession(sessionData);
      setIsLoadingSession(false);
    };
    loadSession();
  }, []);

  // Redirect if not authenticated or not a teacher
  useEffect(() => {
    if (!isLoadingSession && (!session?.user || session.user.role !== "TEACHER")) {
      router.push("/dashboard"); // Or to a generic unauthorized page
    }
  }, [session, isLoadingSession, router]);

  if (isLoadingSession || !session?.user || session.user.role !== "TEACHER") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading or unauthorized...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Subject</h1>
        <Link
          href="/dashboard/subjects"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Back to Subjects
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Subject Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="e.g., Database Management Systems"
              />
            </div>
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Subject Code
              </label>
              <input
                type="text"
                id="code"
                name="code"
                required
                value={formData.code}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="e.g., CS301"
              />
            </div>
            <div>
              <label
                htmlFor="credits"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Credit Value
              </label>
              <select
                id="credits"
                name="credits"
                required
                value={formData.credits}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value={1}>1 Credit</option>
                <option value={3}>3 Credits</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select the appropriate credit value for this subject
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500  focus:ring-offset-2"
            >
              {isLoading ? "Creating..." : "Create Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}