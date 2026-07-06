import React, { useEffect, useState } from 'react';
import { McpService } from '../../services/mcp';
import type { McpTool } from '../../services/mcp';

export const McpDashboard: React.FC = () => {
    const [tools, setTools] = useState<McpTool[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        McpService.getTools()
            .then(setTools)
            .catch((err) => console.error("Failed to fetch tools", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading MCP Tools...</div>;

    return (
        <div className="grid gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-xl font-semibold mb-4">MCP Server Status</h2>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Running (Stdio)</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-xl font-semibold mb-4">Available Tools ({tools.length})</h2>
                <div className="grid gap-4">
                    {tools.map((tool) => (
                        <div key={tool.name} className="p-4 border border-slate-100 rounded-md bg-slate-50">
                            <h3 className="font-mono font-bold text-blue-700">{tool.name}</h3>
                            <p className="text-sm text-slate-600 mt-1">{tool.description}</p>
                            <details className="mt-2">
                                <summary className="text-xs text-slate-500 cursor-pointer">View Schema</summary>
                                <pre className="text-xs bg-slate-900 text-slate-50 p-2 rounded mt-2 overflow-auto">
                                    {JSON.stringify(tool.inputSchema, null, 2)}
                                </pre>
                            </details>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
