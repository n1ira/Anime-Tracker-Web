export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Activity Logs</h1>
        <div className="flex space-x-2">
          <button className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium">
            Clear Logs
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Download Logs
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 flex space-x-4">
          <select className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </select>
          <input
            type="text"
            placeholder="Search logs..."
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          />
        </div>
        <div className="h-[calc(100vh-300px)] overflow-y-auto p-4 font-mono text-sm">
          <div className="text-gray-500">[2023-02-27 10:47:24] Application started</div>
          <div className="text-blue-500">[2023-02-27 10:48:12] Scanning shows...</div>
          <div className="text-green-500">[2023-02-27 10:49:01] Found episode for Example Show S01E07</div>
          <div className="text-yellow-500">[2023-02-27 10:50:15] Warning: Could not parse torrent title</div>
          <div className="text-red-500">[2023-02-27 10:51:30] Error: Failed to connect to Nyaa.si</div>
          {/* Repeat logs for demonstration */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="text-gray-500">
              [2023-02-27 {10 + Math.floor(i / 10)}:{50 + (i % 10)}:{Math.floor(Math.random() * 60)}] Log entry {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 