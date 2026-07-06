import React, { useState } from 'react';
import { McpDashboard } from './McpDashboard';
import { DeveloperDocs } from './DeveloperDocs';

export const McpPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'docs'>('dashboard');

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">MCP Integration</h1>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('docs')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'docs' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Developer Docs
                    </button>
                </div>
            </div>

            {activeTab === 'dashboard' ? <McpDashboard /> : <DeveloperDocs />}
        </div>
    );
};
