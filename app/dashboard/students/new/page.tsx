"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewStudentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    usn: "",
    username: ""
  });
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [bulkStudents, setBulkStudents] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to add student");
      }

      toast.success("Student added successfully");
      router.push("/dashboard/students");
      router.refresh();
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to add student";
      toast.error(errorMsg);
      console.error("Error adding student:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Parse the bulk input data (assuming format: name, usn, username)
      const students = bulkStudents
        .split("\n")
        .filter(line => line.trim())
        .map(line => {
          const [name, usn, username] = line.split(",").map(item => item.trim());
          return { name, usn, username };
        });

      if (!students.length) {
        throw new Error("No valid students data provided");
      }

      // Validate data
      const invalidEntries = students.filter(s => !s.name || !s.usn || !s.username);
      if (invalidEntries.length) {
        throw new Error(`Found ${invalidEntries.length} invalid entries. Please check your data format.`);
      }

      // Add students one by one
      let successCount = 0;
      let failCount = 0;

      for (const student of students) {
        try {
          const response = await fetch("/api/students", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(student)
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to add student: ${student.name}`);
          }
        } catch (error) {
          failCount++;
          console.error(`Failed to add student: ${student.name}`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} students`);
        if (failCount === 0) {
          router.push("/dashboard/students");
          router.refresh();
        }
      }

      if (failCount > 0) {
        toast.error(`Failed to add ${failCount} students`);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to process bulk student data";
      toast.error(errorMsg);
      console.error("Bulk upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
        <Link
          href="/dashboard/students"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Back to Students
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-center mb-6">
          <div className="flex rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setBulkUploadMode(false)}
              className={`px-4 py-2 ${
                !bulkUploadMode
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Single Student
            </button>
            <button
              type="button"
              onClick={() => setBulkUploadMode(true)}
              className={`px-4 py-2 ${
                bulkUploadMode
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Bulk Upload
            </button>
          </div>
        </div>

        {!bulkUploadMode ? (
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Student&apos;s full name"
                />
              </div>
              <div>
                <label htmlFor="usn" className="block text-sm font-medium text-gray-700 mb-1">
                  USN
                </label>
                <input
                  type="text"
                  id="usn"
                  name="usn"
                  required
                  value={formData.usn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., 1XX21XX000"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Student&apos;s username"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoading ? "Adding..." : "Add Student"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <label htmlFor="bulkData" className="block text-sm font-medium text-gray-700 mb-1">
                Bulk Student Data
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Enter one student per line in this format: Full Name, USN, Username
              </p>
              <textarea
                id="bulkData"
                required
                value={bulkStudents}
                onChange={(e) => setBulkStudents(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="John Doe, 1XX21XX001, johndoe&#10;Jane Smith, 1XX21XX002, janesmith"
                rows={6}
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoading ? "Processing..." : "Upload Students"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}