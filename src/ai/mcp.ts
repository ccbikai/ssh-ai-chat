import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { withQuery } from 'ufo'
import env from '@/config/env'
import logger from '@/utils/logger'

interface MCPServerConfig {
  type: 'http' | 'sse'
  url: string
  headers?: Record<string, string>
}

export const mcpServersConfig: MCPServerConfig[] = [
  {
    type: 'http',
    url: withQuery('https://mcp.exa.ai/mcp', {
      tools: 'web_search_exa,get_code_context_exa,crawling_exa',
      exaApiKey: env.EXA_API_KEY,
    }),
  },
  {
    type: 'http',
    url: 'https://mcp.deepwiki.com/mcp',
  },
]

export async function getMCPTools() {
  const mcpClients = (await Promise.all(mcpServersConfig.map(async (serverConfig) => {
    try {
      const mcpClient = await createMCPClient({
        transport: serverConfig,
      })
      return mcpClient
    }
    catch (error) {
      logger.error({ server: serverConfig.url, error: error instanceof Error ? error.message : error }, 'MCP server health check failed')
    }
  }))).filter(Boolean)
  const toolsets = await Promise.all(
    mcpClients.map(client => client.tools().catch((error) => {
      logger.error({ error: error instanceof Error ? error.message : error }, 'MCP fetch tools failed')
      return {}
    })),
  )
  return {
    mcpClients,
    tools: toolsets.reduce((acc, curr) => {
      return { ...acc, ...curr }
    }, {}),
  }
}
