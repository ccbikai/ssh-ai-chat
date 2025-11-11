import { createOpenAI } from '@ai-sdk/openai'
import env from '@/config/env'
import { name, version } from '../../package.json'
import { AI_MODEL_CONFIG, AI_MODEL_LIST } from './config'

export const models = AI_MODEL_LIST.reduce((acc, model) => {
  const config = AI_MODEL_CONFIG[model]
  acc[model] = createOpenAI({
    baseURL: config.api,
    apiKey: config.key,
    name: model,
    headers: {
      'User-Agent': env.USER_AGENT || `${name}/${version}`,
    },
  })
  return acc
}, {})
