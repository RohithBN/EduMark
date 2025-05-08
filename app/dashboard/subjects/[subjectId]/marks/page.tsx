"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  teacher: {
    name: string;
    email: string;
  };
}

interface Mark {
  id: string;
  value: number;
  studentId: string;
  subjectId: string;
  student: {
    id: string;
    name: string;
    usn: string;
    username: string;
  };
}

export default function SubjectMarksPage({ params }: { params: { subjectId: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    average: 0,
    highest: 0,
    lowest: 0,
    passed: 0,
    failed: 0,
    total: 0,
  });

  const { subjectId } = params;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch subject details
        const subjectRes = await fetch(`/api/subjects/${subjectId}`);
        if (!subjectRes.ok) {
          throw new Error("Failed to fetch subject details");
        }
        const subjectData = await subjectRes.json();
        setSubject(subjectData);

        // Fetch marks for this subject
        const marksRes = await fetch(`/api/marks?subjectId=${subjectId}`);
        if (!marksRes.ok) {
          throw new Error("Failed to fetch marks");
        }
        const marksData = await marksRes.json();
        setMarks(marksData);

        // Calculate statistics
        if (marksData.length > 0) {
          const values = marksData.map((mark: Mark) => mark.value);
          const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
          const max = Math.max(...values);
          const min = Math.min(...values);
          const passed = values.filter((v: number) => v >= 40).length;
          const failed = values.length - passed;

          setStats({
            average: avg,
            highest: max,
            lowest: min,
            passed,
            failed,
            total: values.length,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [session, status, subjectId, router]);

  const filteredMarks = searchTerm
    ? marks.filter(
        (mark) =>
          mark.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mark.student.usn.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : marks;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Subject not found</p>
        <Link href="/dashboard/subjects" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Subjects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{subject.name} - Marks</h1>
          <p className="text-gray-600">
            {subject.code} • {subject.credits} {subject.credits === 1 ? "Credit" : "Credits"} • 
            Instructor: {subject.teacher.name || subject.teacher.email}
          </p>
        </div>
        <Link
          href={`/dashboard/subjects/${subjectId}/enter-marks`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Enter Marks
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Average Mark</div>
          <div className="text-2xl font-bold text-gray-900">
            {marks.length > 0 ? stats.average.toFixed(2) : "N/A"}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Highest Mark</div>
          <div className="text-2xl font-bold text-green-600">
            {marks.length > 0 ? stats.highest.toFixed(2) : "N/A"}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Lowest Mark</div>
          <div className="text-2xl font-bold text-red-600">
            {marks.length > 0 ? stats.lowest.toFixed(2) : "N/A"}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Pass Rate</div>
          <div className="text-2xl font-bold text-blue-600">
            {marks.length > 0
              ? `${((stats.passed / stats.total) * 100).toFixed(1)}%`
              : "N/A"}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Students</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Pass / Fail</div>
          <div className="text-2xl font-bold text-gray-900">
            <span className="text-green-600">{stats.passed}</span> /{" "}
            <span className="text-red-600">{stats.failed}</span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search students by name or USN..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {marks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No marks have been entered for this subject yet.
          </div>
        ) : filteredMarks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No students found matching &quot;{searchTerm}&quot;
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Student Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    USN
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Mark
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMarks.map((mark) => (
                  <tr key={mark.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mark.student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{mark.student.usn}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mark.value.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          mark.value >= 40
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {mark.value >= 40 ? "Pass" : "Fail"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/subjects/${subjectId}/enter-marks?studentId=${mark.student.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}