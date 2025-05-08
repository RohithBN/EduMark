"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

interface CountStats {
  students: number;
  subjects: number;
  marks: number;
}

export default function DashboardPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [stats, setStats] = useState<CountStats>({
    students: 0,
    subjects: 0,
    marks: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      const sessionData = await fetchSession();
      setSession(sessionData);
      setIsLoading(false);
    };
    loadSession();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // Fetch students count
        const studentsRes = await fetch("/api/students");
        const students = await studentsRes.json();

        // Fetch subjects count
        const subjectsRes = await fetch("/api/subjects");
        const subjects = await subjectsRes.json();

        // Fetch marks count - this would be simplified in a real app with a count endpoint
        const marksRes = await fetch("/api/marks");
        const marks = await marksRes.json();

        setStats({
          students: students.length,
          subjects: subjects.length,
          marks: marks.length
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session && session.user) {
      fetchStats();
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session || !session.user) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Welcome, {session?.user?.name || session?.user?.email}!
        </h1>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to the PCC Marks Management System</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard 
          title="Total Students" 
          value={stats.students}
          href="/dashboard/students"
          color="bg-blue-500"
        />
        <StatsCard 
          title="Total Subjects" 
          value={stats.subjects}
          href="/dashboard/subjects"
          color="bg-green-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <QuickActionCard 
          title="Add New Student"
          description="Register new students to the system with USN and username."
          href="/dashboard/students/new"
          buttonText="Add Student"
        />
        <QuickActionCard 
          title="Add New Subject"
          description="Create new subject entries with credit system."
          href="/dashboard/subjects/new"
          buttonText="Add Subject"
        />
        <QuickActionCard 
          title="Enter Marks"
          description="Record new marks for students in various subjects."
          href="/dashboard/subjects"
          buttonText="Enter Marks"
        />
        <QuickActionCard 
          title="View Subject Reports"
          description="See consolidated reports for each subject."
          href="/dashboard/subjects"
          buttonText="View Reports"
        />
      </div>
    </div>
  );
}

function StatsCard({ title, value, href, color }: { 
  title: string; 
  value: number; 
  href: string;
  color: string;
}) {
  return (
    <Link 
      href={href}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="p-5">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-medium text-gray-500">{title}</div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
          </div>
          <div className={`${color} rounded-full p-3 text-white`}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

function QuickActionCard({ title, description, href, buttonText }: { 
  title: string; 
  description: string; 
  href: string;
  buttonText: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      <div className="mt-4">
        <Link 
          href={href} 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
}