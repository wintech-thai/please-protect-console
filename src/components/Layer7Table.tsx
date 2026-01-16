'use client'
import { useEffect, useState } from 'react'

interface LogEntry {
  id: string
  timestamp: string
  protocol: string
  src_ip: string
  src_port: number
  dest_ip: string
  dest_port: number
  info: string
  status: string | number
}

export default function Layer7Table() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs') // เรียก API ของเรา
      const data = await res.json()
      
      if (Array.isArray(data)) {
        setLogs(data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 2000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="p-5 text-green-500 animate-pulse">Initializing System...</div>

  return (
    <div className="w-full bg-black/90 border border-gray-800 rounded-lg overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900/50">
        <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          LAYER 7 TRAFFIC
        </h2>
        <div className="text-xs text-gray-500 font-mono">
          LAST UPDATE: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-mono">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800 bg-gray-900/30">
              <th className="p-3">TIME</th>
              <th className="p-3">PROTOCOL</th>
              <th className="p-3">SOURCE</th>
              <th className="p-3">DESTINATION</th>
              <th className="p-3 w-1/3">INFO (DOMAIN/URL)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-green-900/10 transition-colors group">
                {/* Time */}
                <td className="p-3 text-gray-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString('en-GB')}
                </td>

                {/* Protocol Badge */}
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                    log.protocol === 'DNS' 
                      ? 'bg-blue-900/30 text-blue-400 border-blue-800' 
                      : 'bg-yellow-900/30 text-yellow-400 border-yellow-800'
                  }`}>
                    {log.protocol}
                  </span>
                </td>

                {/* Source */}
                <td className="p-3 text-cyan-600 group-hover:text-cyan-400">
                  {log.src_ip}
                </td>

                {/* Destination */}
                <td className="p-3 text-orange-600 group-hover:text-orange-400">
                  {log.dest_ip}
                </td>

                {/* Info */}
                <td className="p-3 text-gray-300 max-w-xs truncate" title={log.info}>
                  {log.info}
                </td>
              </tr>
            ))}
            
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-600">
                  No Traffic Detected
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}