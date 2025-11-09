import { env, exit } from 'node:process'
import 'dotenv/config'

if (!env.AI_MODELS) {
  console.error('AI_MODELS is not set')
  exit(1)
}

const config: NodeJS.ProcessEnv = {
  ...env,
  HOST: env.SSH_HOST ?? env.HOST ?? '0.0.0.0',
  PORT: env.SSH_PORT ?? env.PORT ?? '2222',
  SERVER_NAME: env.SERVER_NAME ?? 'chat.agi.li',
  AI_MODEL_REASONING_MODELS: env.AI_MODEL_REASONING_MODELS ?? '',
}

export default config
