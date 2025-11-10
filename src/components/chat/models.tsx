import type { BoxProps } from 'ink'
import { Box, measureElement, Text, useFocus, useInput } from 'ink'
import SelectInput from 'ink-select-input'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AI_MODEL_CONFIG, AI_MODEL_LIST } from '@/ai/config'
import { useChatContext } from '@/context/chat'
import { useGlobal } from '@/context/global'
import { m } from '@/i18n/messages.js'

const selectModelShortcuts = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']

export default function Models({ ...props }: BoxProps) {
  const { locale, isInputFocused, dimensions } = useGlobal()
  const { model, setModel } = useChatContext()
  const { isFocused } = useFocus({
    id: 'models',
  })

  const initialIndex = AI_MODEL_LIST.indexOf(model.name)

  const selectNewModel = ({ value: newModel }: { value: string }) => {
    const modelId = AI_MODEL_CONFIG[newModel]?.id

    if (!modelId || newModel === model.name) {
      return
    }

    setModel({
      name: newModel,
      id: modelId,
    })
  }

  useInput((input, key) => {
    if (isInputFocused) {
      return
    }
    if (selectModelShortcuts.includes(input) && !key.ctrl && !key.meta) {
      const index = Number.isInteger(+input)
        ? Math.max(0, +input)
        : input.charCodeAt(0) - 'a'.charCodeAt(0) + 10
      selectNewModel({ value: AI_MODEL_LIST[index] })
    }
  })

  const models = useMemo(() => AI_MODEL_LIST.map((value, index) => ({
    label: `${index < 10
      ? index
      : String.fromCharCode(index - 10 + 'a'.charCodeAt(0))}. ${value}`,
    value,
  })), [])

  const modelsRef = useRef(null)
  const [modelsHeight, setModelsHeight] = useState(0)

  useLayoutEffect(() => {
    if (!modelsRef.current) {
      return
    }
    const { height = 0 } = measureElement(modelsRef.current) || {}
    const timeout = setTimeout(() => {
      setModelsHeight(height)
    }, 0)

    return () => {
      clearTimeout(timeout)
    }
  }, [dimensions])

  const modelsListLimit = Math.max(modelsHeight, 1)

  return (
    <Box ref={modelsRef} {...props} paddingX={1} flexDirection="column" overflow="hidden">
      <Box borderStyle="classic" borderColor="blue" borderTop={false} borderRight={false} borderLeft={false}>
        <Text bold wrap="truncate" color={isFocused ? 'greenBright' : 'blueBright'}>{m['model.select'](null, { locale })}</Text>
      </Box>
      <SelectInput
        key={model.name}
        items={models}
        initialIndex={initialIndex}
        isFocused={isFocused}
        limit={modelsListLimit}
        onHighlight={selectNewModel}
      />
    </Box>
  )
}
