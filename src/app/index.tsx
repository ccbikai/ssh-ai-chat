import type { RenderOptions } from 'ink'
import type { Env, User } from '@/context/global'
import type { Locale } from '@/i18n/runtime.js'
import { beep, clearScreen, cursorHide, cursorLeft, cursorNextLine, cursorShow } from 'ansi-escapes'
import { Box, render, useApp, useFocus, useInput, useStdout } from 'ink'
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import Footer from '@/components/footer'
import env from '@/config/env'
import { goodbye } from '@/config/goodbye'
import { GlobalProvider } from '@/context/global'
import { locales } from '@/i18n/runtime.js'
import { track } from '@/utils/track'
import Chat from './chat'
import Help from './help'
import Language from './language'

const pageKeys = {
  '/': '/chat',
  '\\': '/language',
  '|': '/language',
  '、': '/language',
  '?': '/help',
  '？': '/help',
}
const inputId = 'message-input'

function App({ user = {}, env = {} }: { user?: User, env?: Env }) {
  const userLocale = env.LANG?.split('.')[0].replaceAll('_', '-').substring(0, 16) as Locale

  const { exit } = useApp()
  const { stdout } = useStdout()
  const { isFocused: isInputFocused, focus } = useFocus({
    id: inputId,
  })

  const [path, setPath] = useState('/chat')
  const [currentLocale, setCurrentLocale] = useState<Locale>(locales.includes(userLocale) ? userLocale : locales[0])
  const [dimensions, setDimensions] = useState(() => ({
    columns: stdout.columns,
    rows: stdout.rows,
  }))

  const focusInput = useCallback(() => {
    focus(inputId)
  }, [focus])

  const navigate = (newPath: string) => {
    if (path === newPath) {
      return
    }
    setPath(newPath)
    track({
      path: newPath,
      locale: currentLocale,
      username: user.username,
      ip: user.ip,
      columns: dimensions.columns,
      rows: dimensions.rows,
    })
  }

  useInput((input, key) => {
    // logger.debug({
    //   input,
    //   key,
    // }, 'user input')

    if (isInputFocused) {
      return
    }

    // Exit the app
    if (key.ctrl && input === 'c') {
      exit()
      stdout.write(beep)
      stdout.write(clearScreen)
      stdout.write(goodbye(currentLocale))
      stdout.write(cursorNextLine)
      stdout.write(cursorLeft)
      stdout.write(cursorShow)
      stdout.end()
      return
    }

    if (pageKeys[input]) {
      navigate(pageKeys[input])
    }
  })

  useEffect(() => {
    if (path === '/chat') {
      focusInput()
    }
  }, [path, focusInput])

  useLayoutEffect(() => {
    stdout.write(cursorHide)

    const handler = () => {
      stdout.write(clearScreen)
      stdout.write(cursorHide)
      setDimensions({
        columns: stdout.columns,
        rows: stdout.rows,
      })
    }

    stdout.on('resize', handler)
    return () => {
      stdout.off('resize', handler)
      stdout.write(cursorShow)
    }
  }, [stdout])

  return (
    <GlobalProvider
      user={user}
      env={env}
      locale={currentLocale}
      path={path}
      dimensions={dimensions}
      setLocale={setCurrentLocale}
      navigate={navigate}
      isInputFocused={isInputFocused}
      focusInput={focusInput}
    >
      <Box flexDirection="column" width={dimensions.columns - 1} height={dimensions.rows - 1}>
        <Box key={path} flexDirection="column" borderStyle="round" borderColor="blue" flexGrow={1}>
          { path === '/chat' && <Chat /> }
          { path === '/language' && <Language /> }
          { path === '/help' && <Help /> }
        </Box>
        <Footer />
      </Box>
    </GlobalProvider>
  )
}

function createInkApp(options?: RenderOptions & { user?: User, env?: Env }) {
  return render(<App user={options?.user} env={options?.env} />, options)
}

if (env.SSH_SERVER_MODE !== 'true') {
  createInkApp({
    debug: !!env.DEBUG,
    user: {
      username: env.USER || env.USERNAME || env.LOGNAME,
    },
    env: {
      LANG: env.LANG,
    },
  })
}

export default createInkApp
