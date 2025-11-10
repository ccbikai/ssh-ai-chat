import type { BoxProps } from 'ink'
import type { ChatMessage } from '@/types/chat'
import { Box, measureElement, Text, useFocus } from 'ink'
import SelectInput from 'ink-select-input'
import { useLayoutEffect, useRef, useState } from 'react'
import { useChatContext } from '@/context/chat'
import { useGlobal } from '@/context/global'
import { getConversation } from '@/db/conversations'
import { m } from '@/i18n/messages'

function HistoryItem({ label }: { label: string }) {
  return (
    <Box>
      <Text wrap="truncate">{label}</Text>
    </Box>
  )
}

export default function History({ ...props }: BoxProps) {
  const { isFocused } = useFocus({
    id: 'history',
  })
  const { user, locale, dimensions } = useGlobal()
  const { conversations, setMessages, conversationId, setConversationId } = useChatContext()

  const selectConversation = async (conversation: { value: string }) => {
    if (!conversation?.value || conversation.value === conversationId) {
      return
    }

    const conversationData = await getConversation(user.username, conversation.value)

    if (Array.isArray(conversationData?.messages)) {
      setMessages(conversationData.messages as ChatMessage[])
      setConversationId(conversation.value)
    }
    else {
      setMessages([])
      setConversationId(conversation.value)
    }
  }

  const historyRef = useRef(null)
  const [historyHeight, setHistoryHeight] = useState(0)

  useLayoutEffect(() => {
    if (!historyRef.current) {
      return
    }
    const { height = 0 } = measureElement(historyRef.current) || {}
    const timeout = setTimeout(() => {
      setHistoryHeight(height)
    }, 0)

    return () => {
      clearTimeout(timeout)
    }
  }, [dimensions])

  const historyListLimit = Math.max(historyHeight - 2, 1)

  return (
    <Box ref={historyRef} {...props} paddingX={1} flexDirection="column" overflow="hidden">
      <Box borderStyle="classic" borderColor="blue" borderTop={false} borderRight={false} borderLeft={false}>
        <Text bold wrap="truncate" color={isFocused ? 'greenBright' : 'blueBright'}>{m['history.title'](null, { locale })}</Text>
      </Box>
      <SelectInput
        items={conversations}
        isFocused={isFocused}
        limit={historyListLimit}
        itemComponent={HistoryItem}
        onHighlight={selectConversation}
      />
    </Box>
  )
}
