"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock,
  Database,
  TrendingUp,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY; // Store API Key in .env.local

interface GasPriceInfo {
  value: string;
  label: string;
  color: string;
}

interface GasPrices {
  [key: string]: GasPriceInfo;
}

interface HistoricalData {
  timestamp: string;
  safe: number;
  average: number;
  fast: number;
}

const LiveMonitor = () => {
  const [gasPrices, setGasPrices] = useState<GasPrices | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [savingsEstimate, setSavingsEstimate] = useState<number>(0);
  const [optimalTime, setOptimalTime] = useState<string>("");
  const [transactionComplexity, setTransactionComplexity] =
    useState<string>("average");

  // Memoize the gasLimits object so that its reference remains stable between renders
  const gasLimits = useMemo(
    () => ({
      simple: 21000, // Simple ETH transfer
      average: 100000, // Token transfer or simple contract interaction
      complex: 250000, // Complex smart contract interaction
      nft: 200000, // NFT minting
      defi: 350000, // DeFi operations like swaps
    }),
    []
  );

  // Memoized function to update historical data
  const updateHistoricalData = useCallback(
    (safe: number, average: number, fast: number) => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setHistoricalData((prevData) => {
        const newData = [
          ...prevData,
          { timestamp: timeString, safe, average, fast },
        ];
        return newData.length > 12
          ? newData.slice(newData.length - 12)
          : newData;
      });
    },
    []
  );

  // Memoized function to calculate potential savings and determine optimal transaction time
  const calculateSavingsEstimate = useCallback(
    (fastPrice: number, safePrice: number) => {
      const gasLimit =
        gasLimits[transactionComplexity as keyof typeof gasLimits];
      const fastCost = (fastPrice * gasLimit) / 1e9; // Convert to ETH
      const safeCost = (safePrice * gasLimit) / 1e9; // Convert to ETH
      const savings = fastCost - safeCost;
      setSavingsEstimate(savings);

      // Determine optimal time based on current hour (simplified placeholder)
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 0 && hour < 6) {
        setOptimalTime("Current time (midnight-6AM)");
      } else if (hour >= 6 && hour < 12) {
        setOptimalTime("Later today (6PM-midnight)");
      } else if (hour >= 12 && hour < 18) {
        setOptimalTime("Later today (6PM-midnight)");
      } else {
        setOptimalTime("Tomorrow (midnight-6AM)");
      }
    },
    [transactionComplexity, gasLimits]
  );

  // Memoized function to fetch gas prices from Etherscan
  const fetchGasPrices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${API_KEY}`
      );
      const data = await response.json();

      if (data.status === "1" && data.result) {
        const currentPrices = {
          "Safe (Low)": {
            value: data.result.SafeGasPrice,
            label: "Gwei",
            color: "bg-green-100 text-green-800",
          },
          "Average (Standard)": {
            value: data.result.ProposeGasPrice,
            label: "Gwei",
            color: "bg-blue-100 text-blue-800",
          },
          Fast: {
            value: data.result.FastGasPrice,
            label: "Gwei",
            color: "bg-purple-100 text-purple-800",
          },
          "Base Fee": {
            value: data.result.suggestBaseFee,
            label: "Gwei",
            color: "bg-gray-100 text-gray-800",
          },
        };

        setGasPrices(currentPrices);
        setLastUpdated(new Date());

        // Update historical data
        updateHistoricalData(
          parseFloat(data.result.SafeGasPrice),
          parseFloat(data.result.ProposeGasPrice),
          parseFloat(data.result.FastGasPrice)
        );

        // Calculate savings estimate
        calculateSavingsEstimate(
          parseFloat(data.result.FastGasPrice),
          parseFloat(data.result.SafeGasPrice)
        );
      }
    } catch (error) {
      console.error("Error fetching gas prices:", error);
    } finally {
      setLoading(false);
    }
  }, [calculateSavingsEstimate, updateHistoricalData]);

  // Fetch data once on page load and every 30 seconds
  useEffect(() => {
    fetchGasPrices();
    const interval = setInterval(fetchGasPrices, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [fetchGasPrices]);

  // Recalculate savings when transaction complexity changes or when gasPrices update
  useEffect(() => {
    if (gasPrices) {
      calculateSavingsEstimate(
        parseFloat(gasPrices["Fast"].value),
        parseFloat(gasPrices["Safe (Low)"].value)
      );
    }
  }, [transactionComplexity, calculateSavingsEstimate, gasPrices]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-700 text-white px-6 py-4 sm:py-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
            <Database className="mr-3" />
            Live Monitor
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base opacity-90">
            Real-time blockchain activity and network analytics
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gas Price Panel */}
          <div className="bg-white rounded-lg shadow-md p-5 sm:p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gasPrices &&
                    Object.entries(gasPrices).map(([key, data]) => (
                      <div
                        key={key}
                        className={`p-4 rounded-lg ${data.color} flex flex-col items-center justify-center text-center`}
                      >
                        <div className="text-sm sm:text-base font-medium mb-1">
                          {key}
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-2xl sm:text-3xl font-bold">
                            {data.value}
                          </span>
                          <span className="ml-1 text-xs sm:text-sm">
                            {data.label}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                {lastUpdated && (
                  <div className="mt-4 text-xs sm:text-sm text-gray-500 text-center">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
              </>
            )}

            <button
              onClick={fetchGasPrices}
              className="mt-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-md text-sm sm:text-base font-medium transition-colors"
            >
              Refresh Data
            </button>
          </div>

          {/* UNIQUE FEATURE: Gas Price Optimizer */}
          <div className="bg-white rounded-lg shadow-md p-5 sm:p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                <TrendingUp className="mr-2 text-indigo-600" size={20} />
                Gas Price Optimizer
              </h2>
              <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full flex items-center">
                <AlertCircle size={12} className="mr-1" /> Unique Feature
              </span>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type
              </label>
              <select
                value={transactionComplexity}
                onChange={(e) => setTransactionComplexity(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="simple">Simple ETH Transfer (21,000 gas)</option>
                <option value="average">Token Transfer (100,000 gas)</option>
                <option value="complex">
                  Complex Contract Interaction (250,000 gas)
                </option>
                <option value="nft">NFT Minting (200,000 gas)</option>
                <option value="defi">DeFi Operation (350,000 gas)</option>
              </select>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-green-800 flex items-center">
                  <DollarSign size={16} className="mr-1" />
                  Potential Savings
                </h3>
                <span className="text-xs text-green-600 font-medium">
                  Fast vs. Safe
                </span>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {savingsEstimate.toFixed(6)} ETH
                </div>
                <div className="text-sm text-green-600 mt-1">
                  by waiting for lower gas prices
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">
                Optimal Transaction Time
              </h3>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-700">
                  {optimalTime}
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  based on historical patterns
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Chart */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            Gas Price Trends
          </h2>

          {historicalData.length > 1 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={historicalData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="safe"
                    stroke="#10B981"
                    name="Safe (Low)"
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#3B82F6"
                    name="Average"
                  />
                  <Line
                    type="monotone"
                    dataKey="fast"
                    stroke="#8B5CF6"
                    name="Fast"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Collecting data for chart... Please wait.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
