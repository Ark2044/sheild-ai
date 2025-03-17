"use client";
import { useState } from "react";
import ReportTable from "@/components/ReportTable";

export default function ReportPage() {
  const [address, setAddress] = useState("");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!address.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/security-analysis?address=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      setData(result.result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch transaction data"
      );
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Transaction Reports
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Blockchain Address
            </label>
            <input
              id="address"
              type="text"
              placeholder="Enter wallet or contract address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchTransactions}
            disabled={isLoading || !address.trim()}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Loading..." : "Fetch Transactions"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center my-8">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      {data && !isLoading && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Results for: {address}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <ReportTable transactions={data} />
          </div>
        </div>
      )}

      {!data && !isLoading && !error && (
        <div className="text-center py-16 text-gray-500">
          Enter an address and click &apos;Fetch Transactions&apos; to see the
          security analysis report
        </div>
      )}
    </div>
  );
}
