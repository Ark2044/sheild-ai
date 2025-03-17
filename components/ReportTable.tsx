interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: number | string; // Updated to handle both number and string
}

export default function ReportTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  // Function to truncate long strings (like addresses and hashes)
  const truncateMiddle = (str: string, startChars = 6, endChars = 4) => {
    if (str.length <= startChars + endChars) return str;
    return `${str.substring(0, startChars)}...${str.substring(
      str.length - endChars
    )}`;
  };

  // Format ETH value with appropriate decimals, handling both string and number types
  const formatEthValue = (value: number | string) => {
    // Convert to number first to ensure we can use toFixed
    const numValue = typeof value === "string" ? parseFloat(value) : value;

    // Check if it's a valid number
    if (isNaN(numValue)) {
      return "0.000000";
    }

    return numValue.toFixed(6);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Hash
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              From
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              To
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Value (ETH)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                No transactions found
              </td>
            </tr>
          ) : (
            transactions.map((tx, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                  <span
                    className="hover:underline cursor-pointer"
                    title={tx.hash}
                  >
                    {truncateMiddle(tx.hash)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                  <span
                    className="hover:underline cursor-pointer"
                    title={tx.from}
                  >
                    {truncateMiddle(tx.from)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                  <span
                    className="hover:underline cursor-pointer"
                    title={tx.to}
                  >
                    {truncateMiddle(tx.to)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {formatEthValue(tx.value)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
