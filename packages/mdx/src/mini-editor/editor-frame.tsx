import React from "react"
import { FrameButtons } from "../mini-frame"
import { LanguageContext } from "mdx-client/code"
import { SelectLanguage } from "smooth-code/code-tween"
import { CodeFile } from "./editor-shift"

export { getPanelStyles }
export type {
  EditorFrameProps,
  Snapshot,
  OutputPanel,
  TabsSnapshot,
  Tab,
}

type Tab = {
  title: string
  active: boolean
  style: React.CSSProperties
}

type OutputPanel = {
  tabs: Tab[]
  style: React.CSSProperties
  children: React.ReactNode
}

type EditorFrameProps = {
  northPanel: OutputPanel
  southPanel?: OutputPanel | null
  terminalPanel?: React.ReactNode
  height?: number
  northButton?: React.ReactNode
  southButton?: React.ReactNode
  selectLanguages?: SelectLanguage[] | []
  files: CodeFile[]
  onTabClick?: (filename: string) => void
} & React.PropsWithoutRef<JSX.IntrinsicElements["div"]>

export const EditorFrame = React.forwardRef<
  HTMLDivElement,
  EditorFrameProps
>(function InnerEditorFrame(
  {
    northPanel,
    southPanel,
    terminalPanel,
    style,
    height,
    northButton,
    southButton,
    className,
    onTabClick,
    selectLanguages,
    files,
    ...rest
  },
  ref
) {
  const activeTab = northPanel.tabs.find(tab => tab.active)
  const activeFile = files.find(
    file => file.name === activeTab?.title
  )

  return (
    <div
      ref={ref}
      {...rest}
      className="ch-editor-frame"
      style={style}
    >
      <div className="ch-frame-title-bar">
        <TabsContainer
          tabs={northPanel.tabs}
          showFrameButtons={true}
          panel="north"
          onTabClick={onTabClick}
        />
      </div>

      <LanguageSelector
        activeFile={activeFile}
        languages={selectLanguages}
        button={northButton}
      />

      <div
        data-ch-panel="north"
        style={northPanel.style}
        children={northPanel.children}
      />
      {southPanel && (
        <>
          <div
            className="ch-frame-title-bar"
            style={{
              transform: southPanel.style?.transform,
            }}
          >
            <TabsContainer
              tabs={southPanel.tabs}
              showFrameButtons={false}
              button={southButton}
              topBorder={true}
              panel="south"
              onTabClick={onTabClick}
            />
          </div>
          <div
            data-ch-panel="south"
            children={southPanel.children}
            style={southPanel.style}
          />
        </>
      )}
    </div>
  )
})

type TabsContainerProps = {
  tabs: Tab[]
  button?: React.ReactNode
  showFrameButtons: boolean
  topBorder?: boolean
  panel: "north" | "south"
  onTabClick?: (filename: string) => void
}
function TabsContainer({
  tabs,
  button,
  showFrameButtons,
  topBorder,
  panel,
  onTabClick,
}: TabsContainerProps) {
  return (
    <>
      {topBorder && (
        <div className="ch-editor-group-border" />
      )}
      {showFrameButtons ? <FrameButtons /> : <div />}
      {tabs.map(({ title, active, style }) => (
        <div
          key={title}
          title={title}
          data-ch-tab={panel}
          data-active={active}
          className="ch-editor-tab"
          style={style}
          onClick={onTabClick && (() => onTabClick(title))}
        >
          <TabTitle title={title} />
        </div>
      ))}
      <div style={{ flex: 1, minWidth: "0.8em" }} />
      {button}
    </>
  )
}

function TabTitle({ title }: { title: string }) {
  if (!title) {
    return <div />
  }

  const separatorIndex = title.lastIndexOf("/") + 1
  const filename = title.substring(separatorIndex)
  const folder = title.substring(0, separatorIndex)

  return (
    <div>
      <span style={{ opacity: 0.5 }}>{folder}</span>
      {filename}
    </div>
  )
}

type TabsSnapshot = Record<
  string,
  { left: number; active: boolean; width: number }
>
type Snapshot = {
  titleBarHeight: number
  northKey: any
  northHeight: number
  northTabs: TabsSnapshot
  southKey: any
  southHeight: number | null
  southTabs: TabsSnapshot | null
}

function getPanelStyles(
  prev: Snapshot,
  next: Snapshot,
  t: number
): {
  northStyle: React.CSSProperties
  southStyle?: React.CSSProperties
} {
  // +---+---+
  // | x | x |
  // +---+---+
  // |   |   |
  // +---+---+
  if (
    prev.southHeight === null &&
    next.southHeight === null
  ) {
    return {
      northStyle: {
        height: prev.northHeight,
      },
    }
  }

  // +---+---+
  // | x | x |
  // +---+---+
  // | y |   |
  // +---+---+
  if (
    prev.southHeight !== null &&
    next.southHeight === null &&
    next.northKey !== prev.southKey
  ) {
    return {
      northStyle: {
        height: tween(
          prev.northHeight,
          next.northHeight,
          t
        ),
      },
      southStyle: {
        height: prev.southHeight,
      },
    }
  }

  // +---+---+
  // | x | y |
  // +---+---+
  // | y |   |
  // +---+---+
  if (
    prev.southHeight !== null &&
    next.southHeight === null &&
    prev.southKey === next.northKey
  ) {
    return {
      northStyle: {
        height: prev.northHeight,
      },
      southStyle: {
        position: "relative",
        height: tween(
          prev.southHeight,
          next.northHeight + next.titleBarHeight,
          t
        ),
        transform: `translateY(${tween(
          0,
          -(prev.northHeight + prev.titleBarHeight),
          t
        )}px)`,
      },
    }
  }

  // +---+---+
  // | x | x |
  // +---+---+
  // |   | y |
  // +---+---+
  if (
    prev.southHeight === null &&
    next.southHeight !== null &&
    prev.northKey !== next.southKey
  ) {
    return {
      northStyle: {
        height: tween(
          prev.northHeight,
          next.northHeight,
          t
        ),
      },
      southStyle: {
        position: "relative",
        height: next.southHeight!,
      },
    }
  }

  // +---+---+
  // | y | x |
  // +---+---+
  // |   | y |
  // +---+---+
  if (
    prev.southHeight === null &&
    next.southHeight !== null &&
    prev.northKey === next.southKey
  ) {
    return {
      northStyle: {
        height: next.northHeight,
      },
      southStyle: {
        position: "relative",
        height: tween(
          prev.northHeight + prev.titleBarHeight,
          next.southHeight!,
          t
        ),
        transform: `translateY(${tween(
          -(next.northHeight + next.titleBarHeight),
          0,
          t
        )}px)`,
      },
    }
  }

  // +---+---+
  // | x | x |
  // +---+---+
  // | y | y |
  // +---+---+
  return {
    northStyle: {
      height: tween(prev.northHeight, next.northHeight, t),
    },
    southStyle: {
      height: tween(
        prev.southHeight!,
        next.southHeight!,
        t
      ),
    },
  }
}

function tween(a: number, b: number, t: number) {
  return a + (b - a) * t
}

// case switch to map language to language name
function getLanguageName(language) {
  switch (language) {
    case "sh":
      return "shell"
    case "bash":
      return "shell"
    case "curl":
      return "shell"
    case "nodejs":
      return "js"
    default:
      return language
  }
}

type LanguageSelectorProps = {
  activeFile: CodeFile
  languages: SelectLanguage[]
  button?: React.ReactNode
}

function LanguageSelector({
  activeFile,
  languages,
  button,
}: LanguageSelectorProps) {
  const { language, setLanguage } =
    React.useContext(LanguageContext)

  let languageName = language

  if (["sh", "bash", "curl"].includes(languageName)) {
    languageName = "shell"
  }

  return (
    <div className="ch-language-selector">
      <div className="ch-language-selector-content">
        <span>Language:</span>
        {activeFile.codeInDiffLangs.length ? (
          <label
            htmlFor="language"
            className="ch-language-selector-lang"
          >
            <select
              name="language"
              value={getLanguageName(language)}
              defaultValue={getLanguageName(language)}
              onChange={event => {
                const newLanguage = event.target.value
                setLanguage(newLanguage)
              }}
              style={{
                width: `calc(${
                  getLanguageName(languageName).length
                }ch + 12px + 16px)`,
              }}
            >
              {languages.map(({ name }) => {
                let langName = name

                if (["sh", "bash", "curl"].includes(name)) {
                  langName = "shell"
                }

                return (
                  <option
                    key={name}
                    value={getLanguageName(name)}
                  >
                    {langName}
                  </option>
                )
              })}
            </select>
          </label>
        ) : (
          <span className="ch-language-selector-lang">
            {language}
          </span>
        )}
      </div>
      <div className="ch-language-selector-buttons">
        {button}
      </div>
    </div>
  )
}
