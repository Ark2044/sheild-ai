"use client";

import { useCallback, useMemo, useEffect, useState } from "react";
import {
  Clock,
  Database,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Info,
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

const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;

interface GasPriceInfo {
  value: string;
  label: string;
  color: string;
  bgColor: string;
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

interface TransactionType {
  label: string;
  gasLimit: number;
  description: string;
}

const LiveMonitor = () => {
  const [gasPrices, setGasPrices] = useState<GasPrices | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [savingsEstimate, setSavingsEstimate] = useState<number>(0);
  const [savingsInUsd, setSavingsInUsd] = useState<number>(0);
  const [optimalTime, setOptimalTime] = useState<string>("");
  const [transactionComplexity, setTransactionComplexity] =
    useState<string>("average");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [ethPrice, setEthPrice] = useState<number>(0);

  // Transaction types with descriptions
  const transactionTypes = useMemo<Record<string, TransactionType>>(
    () => ({
      simple: {
        label: "Simple ETH Transfer",
        gasLimit: 21000,
        description: "Basic transaction to send ETH between wallets",
      },
      average: {
        label: "Token Transfer",
        gasLimit: 100000,
        description: "ERC-20 token transfers or simple contract interactions",
      },
      complex: {
        label: "Complex Contract",
        gasLimit: 250000,
        description:
          "Advanced smart contract interactions with multiple operations",
      },
      nft: {
        label: "NFT Minting",
        gasLimit: 200000,
        description: "Creating or transferring NFTs (ERC-721/ERC-1155)",
      },
      defi: {
        label: "DeFi Operation",
        gasLimit: 350000,
        description: "Token swaps, liquidity operations, or yield farming",
      },
    }),
    []
  );

  // Update historical data
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

  // Calculate savings
  const calculateSavingsEstimate = useCallback(
    (fastPrice: number, safePrice: number) => {
      const gasLimit =
        transactionTypes[transactionComplexity]?.gasLimit || 21000;
      const fastCost = (fastPrice * gasLimit) / 1e9; // Convert to ETH
      const safeCost = (safePrice * gasLimit) / 1e9; // Convert to ETH
      const savings = fastCost - safeCost;
      setSavingsEstimate(savings);
      setSavingsInUsd(savings * ethPrice);

      // Determine optimal time based on current hour
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
    [transactionComplexity, transactionTypes, ethPrice]
  );

  // Fetch ETH price
  const fetchEthPrice = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${API_KEY}`
      );
      const data = await response.json();
      if (data.status === "1" && data.result) {
        setEthPrice(parseFloat(data.result.ethusd));
      }
    } catch (error) {
      console.error("Error fetching ETH price:", error);
    }
  }, []);

  // Fetch gas prices
  const fetchGasPrices = useCallback(async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      // Fetch ETH price first
      await fetchEthPrice();

      const response = await fetch(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${API_KEY}`
      );
      const data = await response.json();

      if (data.status === "1" && data.result) {
        const currentPrices = {
          "Safe (Low)": {
            value: data.result.SafeGasPrice,
            label: "Gwei",
            color: "text-green-800",
            bgColor: "bg-green-100",
          },
          Average: {
            value: data.result.ProposeGasPrice,
            label: "Gwei",
            color: "text-blue-800",
            bgColor: "bg-blue-100",
          },
          Fast: {
            value: data.result.FastGasPrice,
            label: "Gwei",
            color: "text-purple-800",
            bgColor: "bg-purple-100",
          },
          "Base Fee": {
            value: data.result.suggestBaseFee,
            label: "Gwei",
            color: "text-gray-800",
            bgColor: "bg-gray-100",
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
      setTimeout(() => setRefreshing(false), 500); // Visual feedback
    }
  }, [calculateSavingsEstimate, updateHistoricalData, fetchEthPrice]);

  // Initial fetch
  useEffect(() => {
    fetchGasPrices();

    // Optional: Set up polling for real-time updates
    const interval = setInterval(fetchGasPrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [fetchGasPrices]);

  // Recalculate savings when necessary
  useEffect(() => {
    if (gasPrices) {
      calculateSavingsEstimate(
        parseFloat(gasPrices["Fast"].value),
        parseFloat(gasPrices["Safe (Low)"].value)
      );
    }
  }, [transactionComplexity, calculateSavingsEstimate, gasPrices]);

  // Format timestamp for better readability
  const formatTimestamp = (timestamp: string) => {
    return timestamp;
  };

  // Handler for the new button
  const handlePredictRugpool = () => {
    console.log("Predict Current Rugpull button clicked");
    // TODO: Implement prediction logic here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with improved UI */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Database className="mr-3" size={28} />
                Ethereum Gas Tracker
              </h1>
              <p className="mt-2 text-base opacity-90 max-w-2xl">
                Track real-time gas prices, optimize your transactions, and save
                on fees
              </p>
            </div>

            <button
              onClick={fetchGasPrices}
              disabled={refreshing}
              className="mt-4 sm:mt-0 bg-white hover:bg-blue-50 text-blue-700 py-2 px-6 rounded-md font-medium transition-colors flex items-center shadow-sm disabled:opacity-75"
            >
              {refreshing ? (
                <RefreshCw className="mr-2 animate-spin" size={18} />
              ) : (
                <RefreshCw className="mr-2" size={18} />
              )}
              Refresh
            </button>
          </div>

          <div className="mt-4 bg-blue-600/40 p-3 rounded-lg text-sm">
            <div className="flex items-start">
              <Info size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <p>
                This dashboard helps you monitor Ethereum gas prices in
                real-time and optimize your transaction timing. Compare costs
                between different speed options and find the best time to
                execute your transactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Gas Price Cards - Now in a vertical column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold flex items-center text-gray-800">
                    <Database className="mr-2 text-blue-600" size={20} />
                    Current Gas Prices
                  </h2>
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1 text-blue-500" />
                    <span className="text-xs text-blue-500 font-medium">
                      {lastUpdated
                        ? `Updated ${lastUpdated.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "Loading..."}
                    </span>
                  </div>
                </div>
              </div>

              {/* New Button for Predicting Rugpool */}
              <div className="p-3 border-b border-gray-100">
                <button
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
                  onClick={handlePredictRugpool}
                >
                  Predict Current Rugpool
                </button>
              </div>

              <div className="p-5">
                {loading && !gasPrices ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-16 bg-gray-200 rounded-lg"
                      ></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gasPrices &&
                      Object.entries(gasPrices).map(([key, data]) => (
                        <div
                          key={key}
                          className={`rounded-lg ${data.bgColor} p-4 flex justify-between items-center shadow-sm`}
                        >
                          <div className={`font-medium ${data.color}`}>
                            {key}
                          </div>
                          <div className="flex items-baseline">
                            <span
                              className={`text-2xl font-bold ${data.color}`}
                            >
                              {data.value}
                            </span>
                            <span
                              className={`ml-1 text-sm ${data.color} opacity-80`}
                            >
                              {data.label}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Historical Chart moved below gas prices on mobile */}
            <div className="mt-6 bg-white rounded-xl shadow-md p-5 lg:hidden">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                <TrendingUp className="mr-2 text-indigo-600" size={20} />
                Gas Price Trends
              </h2>

              {historicalData.length > 1 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={historicalData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={formatTimestamp}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [`${value} Gwei`, ""]}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="safe"
                        stroke="#10B981"
                        name="Safe"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke="#3B82F6"
                        name="Average"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="fast"
                        stroke="#8B5CF6"
                        name="Fast"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-3 text-blue-500" />
                    <p>Collecting data for chart...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optimizer with improved UI - Takes 3 columns on desktop */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold flex items-center text-gray-800">
                    <TrendingUp className="mr-2 text-indigo-600" size={20} />
                    Gas Price Optimizer
                  </h2>
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full font-medium">
                    Save on gas fees
                  </span>
                </div>
              </div>

              <div className="p-5">
                {/* Transaction Type Selector with improved UI */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select your transaction type:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(transactionTypes).map(([key, type]) => (
                      <button
                        key={key}
                        onClick={() => setTransactionComplexity(key)}
                        className={`p-3 rounded-lg text-left border ${
                          transactionComplexity === key
                            ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                            : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                        } transition-all`}
                      >
                        <div className="font-medium text-gray-800">
                          {type.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {type.gasLimit.toLocaleString()} gas units
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {transactionTypes[transactionComplexity]?.description}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Savings Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-green-800 flex items-center">
                        <DollarSign size={16} className="mr-1" />
                        Potential Savings
                      </h3>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Fast vs. Safe
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-700">
                        {savingsEstimate.toFixed(6)} ETH
                      </div>
                      {ethPrice > 0 && (
                        <div className="text-sm font-medium text-green-600 mt-1">
                          ≈ ${savingsInUsd.toFixed(2)} USD
                        </div>
                      )}
                      <div className="text-xs text-green-600 mt-3 bg-green-100/50 p-2 rounded">
                        You can save this amount by choosing a slower
                        transaction speed
                      </div>
                    </div>
                  </div>

                  {/* Optimal Time Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-blue-800 flex items-center">
                        <Clock size={16} className="mr-1" />
                        Optimal Transaction Time
                      </h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Recommendation
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700">
                        {optimalTime}
                      </div>
                      <div className="mt-3 text-xs text-blue-600 bg-blue-100/50 p-2 rounded">
                        Gas prices are typically lower during off-peak hours
                        when network activity decreases
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Details Box */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-3">
                    Transaction Cost Breakdown
                  </h3>
                  <div className="space-y-2">
                    {gasPrices && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Fast Speed:</span>
                          <span className="font-medium text-gray-800">
                            {(
                              (parseFloat(gasPrices["Fast"].value) *
                                transactionTypes[transactionComplexity]
                                  .gasLimit) /
                              1e9
                            ).toFixed(6)}{" "}
                            ETH
                            {ethPrice > 0 && (
                              <span className="text-xs text-gray-500 ml-1">
                                ($
                                {(
                                  ((parseFloat(gasPrices["Fast"].value) *
                                    transactionTypes[transactionComplexity]
                                      .gasLimit) /
                                    1e9) *
                                  ethPrice
                                ).toFixed(2)}
                                )
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Average Speed:</span>
                          <span className="font-medium text-gray-800">
                            {(
                              (parseFloat(gasPrices["Average"].value) *
                                transactionTypes[transactionComplexity]
                                  .gasLimit) /
                              1e9
                            ).toFixed(6)}{" "}
                            ETH
                            {ethPrice > 0 && (
                              <span className="text-xs text-gray-500 ml-1">
                                ($
                                {(
                                  ((parseFloat(gasPrices["Average"].value) *
                                    transactionTypes[transactionComplexity]
                                      .gasLimit) /
                                    1e9) *
                                  ethPrice
                                ).toFixed(2)}
                                )
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Safe Speed:</span>
                          <span className="font-medium text-gray-800">
                            {(
                              (parseFloat(gasPrices["Safe (Low)"].value) *
                                transactionTypes[transactionComplexity]
                                  .gasLimit) /
                              1e9
                            ).toFixed(6)}{" "}
                            ETH
                            {ethPrice > 0 && (
                              <span className="text-xs text-gray-500 ml-1">
                                ($
                                {(
                                  ((parseFloat(gasPrices["Safe (Low)"].value) *
                                    transactionTypes[transactionComplexity]
                                      .gasLimit) /
                                    1e9) *
                                  ethPrice
                                ).toFixed(2)}
                                )
                              </span>
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Chart for Desktop - Full width */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6 hidden lg:block">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
            <TrendingUp className="mr-2 text-indigo-600" size={20} />
            Gas Price Trends
          </h2>

          {historicalData.length > 1 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={historicalData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTimestamp}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [`${value} Gwei`, ""]}
                    labelFormatter={(label) => `Time: ${label}`}
                    contentStyle={{
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px" }} />
                  <Line
                    type="monotone"
                    dataKey="safe"
                    stroke="#10B981"
                    name="Safe"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#3B82F6"
                    name="Average"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fast"
                    stroke="#8B5CF6"
                    name="Fast"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500">
              <div className="text-center">
                <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-3 text-blue-500" />
                <p>Collecting data for chart...</p>
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-center text-gray-500">
            Chart shows recent gas price trends. More historical data will
            appear as you keep the page open.
          </div>
        </div>

        {/* Additional Tips Section */}
        <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <Info className="mr-2 text-blue-600" size={20} />
              Gas Saving Tips
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-2">
                  Use Off-Peak Hours
                </h3>
                <p className="text-sm text-blue-700">
                  Transaction fees are typically lower during periods of reduced
                  network activity, especially during early morning hours (UTC).
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="font-medium text-purple-800 mb-2">
                  Batch Transactions
                </h3>
                <p className="text-sm text-purple-700">
                  When possible, batch multiple operations into a single
                  transaction to save on the base fee paid per transaction.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="font-medium text-green-800 mb-2">
                  Layer 2 Solutions
                </h3>
                <p className="text-sm text-green-700">
                  Consider using Layer 2 networks like Optimism, Arbitrum, or
                  Polygon for significant gas savings on compatible
                  applications.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Last updated:{" "}
            {lastUpdated ? lastUpdated.toLocaleString() : "Loading..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
