import api from './api';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

export const McpService = {
  getTools: async () => {
    const response = await api.get<McpTool[]>('/mcp/tools');
    return response.data;
  },
};
