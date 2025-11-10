import type { ChatMessage } from '@/types/chat'
import { extractReasoningMiddleware, generateText, stepCountIs, streamText, wrapLanguageModel } from 'ai'
import { throttle } from 'es-toolkit'
import { useInput } from 'ink'
import { useCallback, useEffect, useRef, useState } from 'react'
import { uuidv7 } from 'uuidv7'
import { models } from '@/ai'
import { AI_MODEL_CONFIG, AI_MODEL_LIST } from '@/ai/config'
import { getMCPTools } from '@/ai/mcp'
import env from '@/config/env'
import { useGlobal } from '@/context/global'
import { createOrUpdateConversation, getConversationList } from '@/db/conversations'
import { m } from '@/i18n/messages.js'
import kv, { kvConfig } from '@/kv'
import logger from '@/utils/logger'
import { track } from '@/utils/track'
import { generateChatPrompt, generateSystemPrompt } from './prompt'
import { chatPreCheck } from './utils'

interface CurrentModel {
  name: string
  id: string
}

export function useChat() {
  const defaultModel = {
    name: AI_MODEL_LIST[0] ?? '',
    id: AI_MODEL_CONFIG[AI_MODEL_LIST[0] ?? '']?.id ?? '',
  }
  const [model, setModel] = useState<CurrentModel>(defaultModel)
  const [conversationId, setConversationId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversations, setConversations] = useState([])

  const { locale, isInputFocused, focusInput, user, path } = useGlobal()
  const cancelChatRef = useRef<AbortController>(new AbortController())

  const fetchConversationList = useCallback(async ({ isInitial = false }: { isInitial?: boolean } = {}) => {
    const conversationList = await getConversationList(user.username)

    if (isInitial) {
      const newConversationId = uuidv7()
      setConversations([{
        label: m['chat.newConversation'](null, { locale }),
        value: newConversationId,
      }])
      setConversationId(newConversationId)
    }
    else {
      setConversations([])
    }

    if (Array.isArray(conversationList)) {
      setConversations((prev) => {
        const newConversations = conversationList.map(conversation => ({
          label: conversation.title?.replace(/\s+/g, ' ').trim(),
          value: conversation.conversationId,
        }))
        return [...prev, ...newConversations]
      })
    }
  }, [user.username, locale])

  const saveConversation = useCallback(async (messages: ChatMessage[]) => {
    try {
      await createOrUpdateConversation(user.username, conversationId, m['chat.newConversation'](null, { locale }), messages)

      const systemModel = AI_MODEL_CONFIG[env.AI_SYSTEM_MODEL]?.id
        ? models[env.AI_SYSTEM_MODEL].chat(AI_MODEL_CONFIG[env.AI_SYSTEM_MODEL]?.id)
        : models[defaultModel.name].chat(defaultModel.id)
      const { text: title } = await generateText({
        model: wrapLanguageModel({
          model: systemModel,
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        system: generateSystemPrompt(locale),
        messages: [
          {
            role: 'user',
            content: `<conversation>${messages.filter(message => message.role === 'user')
              .slice(0, 10)
              .map(message => `${message.role}: ${message.content}`)
              .join('\n')}</conversation>`,
          },
        ],
      })

      logger.info({ username: user.username, title: title?.trim() }, 'save conversation title')
      await createOrUpdateConversation(user.username, conversationId, title?.slice(0, 128)?.trim(), messages)
      fetchConversationList()
    }
    catch (error) {
      logger.error({ error: error instanceof Error ? error.message : error }, 'save conversation failed')
    }
  }, [user.username, conversationId, locale, defaultModel.name, defaultModel.id, fetchConversationList])

  const appendMessage = async (message: string) => {
    logger.debug(`request LLM(${model.name})`)
    logger.debug(`User: ${message}`)

    cancelChatRef.current.abort()

    const userMessageId = crypto.randomUUID()
    const assistantMessageId = crypto.randomUUID()

    const { passed, tips, rateLimitKey, rateLimitTimes } = await chatPreCheck(user)

    if (!passed) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: tips,
        metadata: { modelName: model.name, id: assistantMessageId },
      }])
      logger.info({ username: user.username, rateLimitTimes, model: model.name }, 'chat precheck limit')
      return
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      metadata: { id: userMessageId },
    }
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: m['chat.thinking'](null, { locale }),
      metadata: { modelName: model.name, id: assistantMessageId, version: 0 },
    }

    logger.debug(assistantMessage)

    setMessages(prev => [...prev, userMessage, assistantMessage])

    try {
      track(Object.assign({ event: 'chat', path, locale }, user), { model: model.name })

      const thinkingModel = env.AI_MODEL_REASONING_MODELS?.split(',')

      const { mcpClients, tools } = await getMCPTools()

      // logger.debug(tools, 'Available tools from MCP servers')

      cancelChatRef.current = new AbortController()
      const { textStream } = streamText({
        abortSignal: cancelChatRef.current.signal,
        system: generateChatPrompt(locale, model.name),
        messages: [...messages, userMessage],
        tools,
        stopWhen: stepCountIs(20),
        model: thinkingModel.includes(model.name)
          ? wrapLanguageModel({
              model: models[model.name].chat(model.id),
              middleware: extractReasoningMiddleware({ tagName: 'think' }),
            })
          : models[model.name].chat(model.id),
        onError: (error) => {
          assistantMessage.content = m['chat.error'](null, { locale })
          assistantMessage.metadata.version++
          setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage, metadata: { ...assistantMessage.metadata } }])
          logger.error(error, `request LLM(${model.name}) failed`)
        },
        // onChunk: (chunk) => {
        //   logger.debug(chunk, `request LLM(${model.name}) chunk`)
        // },
        onFinish: async ({ usage, finishReason }) => {
          logger.info({
            usage,
            finishReason,
          }, `request LLM(${model.name}) result`)
          await Promise.all(
            mcpClients.map(async (client) => {
              client.close().catch((error) => {
                logger.error({ error: error instanceof Error ? error.message : error }, 'MCP client close failed')
              })
            }),
          )
          await kv.set(rateLimitKey, rateLimitTimes + 1, 'EX', kvConfig.rateLimit.ttl)
        },
      })

      const updateMessages = throttle(
        () => {
          setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage, metadata: { ...assistantMessage.metadata } }])
        },
        300,
      )

      for await (const chunk of textStream) {
        logger.debug(`Assistant: ${chunk}`)
        if (assistantMessage.metadata.version === 0) {
          assistantMessage.content = ''
        }
        assistantMessage.content += chunk
        assistantMessage.metadata.version++
        updateMessages()
      }

      assistantMessage.metadata.version++
      setMessages((prev) => {
        const newMessages = [...prev.slice(0, -1), { ...assistantMessage, metadata: { ...assistantMessage.metadata } }]
        saveConversation(newMessages)
        return newMessages
      })
    }
    catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      assistantMessage.content += m['chat.error'](null, { locale })
      assistantMessage.metadata.version++
      setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage, metadata: { ...assistantMessage.metadata } }])
      logger.error({ error: error instanceof Error ? error.message : error }, `request LLM(${model.name}) failed`)
    }
  }

  useInput((input) => {
    if (isInputFocused) {
      return
    }
    if (['n', 'N'].includes(input)) {
      cancelChatRef.current.abort()
      fetchConversationList({ isInitial: true })
      setMessages([])
      focusInput()
    }
    if (['i', 'I', '\r'].includes(input)) {
      focusInput()
    }
  })

  useEffect(() => {
    fetchConversationList({ isInitial: true })
  }, [fetchConversationList])

  return {
    model,
    setModel,
    conversationId,
    setConversationId,
    messages,
    setMessages,
    appendMessage,
    conversations,
  }
}
