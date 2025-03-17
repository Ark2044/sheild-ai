"use client";

import { useEffect, useState } from "react";
import { Clock, Database } from "lucide-react";

const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY; // Store API Key in .env.local

interface GasPriceInfo {
  value: string;
  label: string;
  color: string;
}

interface GasPrices {
  [key: string]: GasPriceInfo;
}

const LiveMonitor = () => {
  const [gasPrices, setGasPrices] = useState<GasPrices | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch All Gas Prices from Etherscan
  const fetchGasPrices = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${API_KEY}`
      );
      const data = await response.json();

      if (data.status === "1" && data.result) {
        setGasPrices({
          "Safe (Low)": {
            value: `${data.result.SafeGasPrice}`,
            label: "Gwei",
            color: "bg-green-100 text-green-800",
          },
          "Average (Standard)": {
            value: `${data.result.ProposeGasPrice}`,
            label: "Gwei",
            color: "bg-blue-100 text-blue-800",
          },
          Fast: {
            value: `${data.result.FastGasPrice}`,
            label: "Gwei",
            color: "bg-purple-100 text-purple-800",
          },
          "Base Fee": {
            value: `${data.result.suggestBaseFee}`,
            label: "Gwei",
            color: "bg-gray-100 text-gray-800",
          },
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching gas prices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGasPrices();
    const interval = setInterval(fetchGasPrices, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-700 text-white p-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center">
            <Database className="mr-3" />
            Live Monitor
          </h1>
          <p className="mt-2 opacity-90">
            Real-time blockchain activity and network analytics
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gas Price Panel */}
          <div className="bg-white rounded-lg shadow-md p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Database className="mr-2 text-blue-600" size={20} />
                Gas Price Monitor
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                <Clock size={12} className="mr-1" /> Live
              </span>
            </div>

            {loading && !gasPrices ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-md"></div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {gasPrices &&
                    Object.entries(gasPrices).map(([key, data]) => (
                      <div
                        key={key}
                        className={`p-4 rounded-lg ${data.color} flex flex-col items-center justify-center`}
                      >
                        <div className="text-sm font-medium mb-1">{key}</div>
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold">
                            {data.value}
                          </span>
                          <span className="ml-1 text-xs">{data.label}</span>
                        </div>
                      </div>
                    ))}
                </div>

                {lastUpdated && (
                  <div className="mt-4 text-xs text-gray-500 text-center">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
              </>
            )}

            <button
              onClick={fetchGasPrices}
              className="mt-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
