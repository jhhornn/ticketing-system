import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

async function main() {
  // 1. Connect to the MCP Server
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/mcp/main.js'],
  });

  const client = new Client({
    name: 'LangChain Client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  await client.connect(transport);

  // 2. List available tools
  const toolsList = await client.listTools();
  console.log('Available Tools:', toolsList.tools.map(t => t.name));

  // 3. Use with LangChain (Conceptual - LangChain MCP integration varies)
  // For this example, we'll manually invoke the tool to demonstrate
  
  const tenantId = 'tenant-123';
  
  console.log('\n--- Querying Events ---');
  const events: any = await client.callTool({
    name: 'list_events',
    arguments: { tenantId },
  });
  console.log('Events:', events);

  if (events.content && events.content[0] && events.content[0].text) {
    const eventList = JSON.parse(events.content[0].text);
    if (eventList.length > 0) {
      const eventId = eventList[0].id;
      
      console.log(`\n--- Checking Seats for Event ${eventId} ---`);
      const seats = await client.callTool({
        name: 'get_seat_availability_summary',
        arguments: { tenantId, eventId },
      });
      console.log('Seat Summary:', seats);
    }
  }

  await client.close();
}

// main().catch(console.error);
