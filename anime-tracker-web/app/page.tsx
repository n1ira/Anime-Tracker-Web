import Image from "next/image";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tracked Shows</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          Add Show
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Show cards will go here */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold">Example Show</h2>
            <div className="flex space-x-2">
              <button className="text-gray-500 hover:text-blue-600">
                Edit
              </button>
              <button className="text-gray-500 hover:text-red-600">
                Delete
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <p>Season 1, Episodes 1-12</p>
            <p>Quality: 1080p</p>
            <p>Downloaded: 6/12 episodes</p>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium">
              Scan
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Episodes</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Select a show to view episodes
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="h-48 overflow-y-auto p-4 font-mono text-sm">
            <div className="text-gray-500">[2023-02-27 10:47:24] Application started</div>
            <div className="text-blue-500">[2023-02-27 10:48:12] Scanning shows...</div>
            <div className="text-green-500">[2023-02-27 10:49:01] Found episode for Example Show S01E07</div>
          </div>
        </div>
      </div>
    </div>
  );
}
