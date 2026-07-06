import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

type ToolContentItem = {
  text?: string;
};

type ToolCallResult = {
  content?: ToolContentItem[];
};

type EventListItem = {
  id: number;
};

function getFirstTextContent(result: ToolCallResult): string | null {
  const [firstItem] = result.content ?? [];
  return typeof firstItem?.text === 'string' ? firstItem.text : null;
}

function parseEventList(rawText: string): EventListItem[] {
  try {
    const parsed = JSON.parse(rawText) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry): entry is EventListItem =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as { id?: unknown }).id === 'number',
    );
  } catch {
    return [];
  }
}

export async function main() {
  // 1. Connect to the MCP Server
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/mcp/main.js'],
  });

  const client = new Client(
    {
      name: 'LangChain Client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    },
  );

  await client.connect(transport);

  // 2. List available tools
  const toolsList = await client.listTools();
  console.log(
    'Available Tools:',
    toolsList.tools.map((t) => t.name),
  );

  // 3. Use with LangChain (Conceptual - LangChain MCP integration varies)
  // For this example, we'll manually invoke the tool to demonstrate

  console.log('\n--- Querying Events ---');
  const events = (await client.callTool({
    name: 'list_events',
    arguments: {},
  })) as ToolCallResult;
  console.log('Events:', events);

  const firstEventsText = getFirstTextContent(events);

  if (firstEventsText) {
    const eventList = parseEventList(firstEventsText);

    if (eventList.length > 0) {
      const eventId = eventList[0].id;

      console.log(`\n--- Checking Seats for Event ${eventId} ---`);
      const seats = await client.callTool({
        name: 'get_seat_availability_summary',
        arguments: { eventId },
      });
      console.log('Seat Summary:', seats);
    }
  }

  await client.close();
}

// main().catch(console.error);
