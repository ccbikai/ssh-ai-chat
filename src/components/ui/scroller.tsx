import type { BoxProps } from 'ink'
import { Box, measureElement, useInput, useStdout } from 'ink'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

interface ScrollerProps extends BoxProps {
  children: React.ReactNode
  version: string | number
  shortcuts?: boolean
}

export default function Scroller({ children, ...props }: ScrollerProps) {
  const containerRef = useRef(null)
  const scrollRef = useRef(null)
  const versionRef = useRef<string | number>(0)

  const containerLayout = useRef<{ height: number, width: number }>({
    height: 0,
    width: 0,
  })
  const scrollLayout = useRef<{ height: number, width: number }>({
    height: 0,
    width: 0,
  })

  const [scrollTop, setScrollTop] = useState(0)
  const { stdout } = useStdout()

  const scrollToEnd = useCallback(() => {
    if (props.version !== versionRef.current) {
      versionRef.current = props.version
      scrollLayout.current = scrollRef.current && measureElement(scrollRef.current)

      if (scrollLayout.current.height < containerLayout.current.height) {
        setScrollTop(0)
        return
      }

      const top = Math.max(0, scrollLayout.current.height - containerLayout.current.height)

      // Hacks
      if (!props.version) {
        setScrollTop(top + 2)
      }
      else {
        setScrollTop(top + 1)
      }
    }
  }, [props.version])

  useEffect(() => {
    containerRef.current && (containerLayout.current = measureElement(containerRef.current))
    scrollRef.current && (scrollLayout.current = measureElement(scrollRef.current))

    stdout.on('resize', scrollToEnd)

    return () => {
      stdout.off('resize', scrollToEnd)
    }
  }, [stdout, scrollToEnd])

  useLayoutEffect(() => {
    // logger.debug({ pv: props.version, version: versionRef.current }, 'scroller version')
    const timeout = setTimeout(() => {
      scrollToEnd()
    }, 0)

    return () => {
      clearTimeout(timeout)
    }
  }, [children, props.version, scrollToEnd])

  useInput((input, key) => {
    if (!props.shortcuts) {
      return
    }

    scrollRef.current && (scrollLayout.current = measureElement(scrollRef.current))
    // logger.debug({ containerLayout, scrollLayout, scrollTop }, 'scroller shortcuts')
    if (key.upArrow) {
      setScrollTop(
        Math.max(0, scrollTop - 1),
      )
    }
    else if (key.downArrow) {
      setScrollTop(
        Math.min(
          Math.max(
            0,
            scrollLayout.current.height - containerLayout.current.height,
          ),
          scrollTop + 1,
        ),
      )
    }
    else if (key.pageUp) {
      setScrollTop(
        Math.max(
          0,
          scrollTop - containerLayout.current.height,
        ),
      )
    }
    else if (key.pageDown) {
      setScrollTop(
        Math.min(
          Math.max(
            0,
            scrollLayout.current.height - containerLayout.current.height,
          ),
          scrollTop + containerLayout.current.height,
        ),
      )
    }
  })

  return (
    <Box
      ref={containerRef}
      flexDirection="column"
      overflow="hidden"
      {...props}
    >
      <Box
        ref={scrollRef}
        flexShrink={0}
        flexDirection="column"
        marginTop={-scrollTop}
      >
        {children}
      </Box>
    </Box>
  )
}
