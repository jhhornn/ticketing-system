import React from 'react';

export const DeveloperDocs: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mt-6 text-sm leading-relaxed">
            <h2 className="text-xl font-semibold mb-4">Connecting your Agent</h2>
            <p className="mb-2">To connect your local Agent (Cursor, Claude Desktop, etc.) to this MCP server:</p>

            <h3 className="font-bold mt-4">1. Configuration</h3>
            <p className="mb-2">Add this to your agent's MCP config file:</p>
            <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto mb-4 font-mono">
                {`{
  "mcpServers": {
    "ticketing-system": {
      "command": "node",
      "args": [
        "/absolute/path/to/ticketing-system/dist/main.js" 
      ],
      "env": {
         "DATABASE_URL": "postgresql://..."
      }
    }
  }
}`}
            </pre>

            <p className="text-slate-500">Note: Adjust the path to the absolute path of your `dist/main.js` file.</p>
        </div>
    );
};
