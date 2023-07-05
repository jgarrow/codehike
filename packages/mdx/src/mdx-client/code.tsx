import React from "react"
import { CodeConfig, CodeSpring } from "../smooth-code"
import {
  EditorSpring,
  EditorProps,
  EditorStep,
} from "../mini-editor"
import { CodeHikeConfig } from "../remark/config"
import { Code } from "../utils/code"
import { File } from "../remark/code"

export const LanguageContext = React.createContext({
  language: "shell",
  setLanguage: (lang: string) => {},
})

function getCode(step: CodeProps, language: string) {
  return {
    ...step,
    files: step.files.map(file => {
      const diffLang =
        file?.codeInDiffLangs &&
        file?.codeInDiffLangs.length
          ? file?.codeInDiffLangs.find(
              (fileCode: File) =>
                fileCode.code.lang === language
            )
          : null

      const code: Code = diffLang?.code ?? file.code

      return {
        ...file,
        code,
      }
    }),
  }
}

type CodeProps = EditorProps & Partial<CodeHikeConfig>

export function Code(props: CodeProps) {
  const [language, setLanguage] = React.useState(
    props.files.find(
      file => file.name === props.northPanel.active
    )?.code.lang
  )
  const [step, setStep] = React.useState(
    getCode(props, language)
  )

  React.useEffect(() => {
    const newStep = getCode(step, language)
    setStep(newStep)
  }, [language, getCode, setStep])

  function onTabClick(filename: string) {
    const newStep = updateEditorStep(step, filename, null)
    const newLanguage = newStep.files.find(
      file => file.name === filename
    )?.code.lang

    setLanguage(newLanguage)
    setStep({ ...step, ...newStep })
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage }}
    >
      <InnerCode {...step} onTabClick={onTabClick} />
    </LanguageContext.Provider>
  )
}

// build the CodeConfig from props and props.codeConfig
export function mergeCodeConfig<T>(
  props: Partial<CodeConfig> & {
    codeConfig: Partial<CodeConfig>
  } & T
) {
  const {
    lineNumbers,
    showCopyButton,
    showExpandButton,
    selectLanguages,
    minZoom,
    maxZoom,
    ...rest
  } = props
  const codeConfig = {
    ...props.codeConfig,
    maxZoom:
      maxZoom == null ? props.codeConfig?.maxZoom : maxZoom,
    minZoom:
      minZoom == null ? props.codeConfig?.minZoom : minZoom,
    horizontalCenter:
      props.codeConfig?.horizontalCenter ??
      props.horizontalCenter,
    lineNumbers:
      lineNumbers == null
        ? props.codeConfig?.lineNumbers
        : lineNumbers,
    showCopyButton:
      showCopyButton == null
        ? props.codeConfig?.showCopyButton
        : showCopyButton,
    showExpandButton:
      showExpandButton == null
        ? props.codeConfig?.showExpandButton
        : showExpandButton,
    selectLanguages:
      selectLanguages ?? props.codeConfig?.selectLanguages,
    rows: props.rows,
    debug: props.debug ?? props.codeConfig?.debug,
  }
  return { ...rest, codeConfig }
}

export function InnerCode({
  onTabClick,
  ...props
}: EditorProps & {
  onTabClick?: (filename: string) => void
} & Partial<CodeHikeConfig>) {
  const { className, style, codeConfig, ...editorProps } =
    mergeCodeConfig(props)

  if (
    !props.southPanel &&
    props.files.length === 1 &&
    !props.files[0].name
  ) {
    return (
      <div
        className={`ch-codeblock not-prose ${
          className || ""
        }`}
        data-ch-theme={props.codeConfig?.themeName}
        style={style}
      >
        <CodeSpring
          className="ch-code"
          config={codeConfig}
          step={editorProps.files[0]}
        />
      </div>
    )
  } else {
    const frameProps = {
      ...editorProps?.frameProps,
      onTabClick,
    }
    return (
      <div
        className={`ch-codegroup not-prose ${
          className || ""
        }`}
        data-ch-theme={props.codeConfig?.themeName}
        style={style}
      >
        <EditorSpring
          {...editorProps}
          frameProps={frameProps}
          codeConfig={codeConfig}
        />
      </div>
    )
  }
}

export function updateEditorStep(
  step: EditorStep,
  filename: string | undefined,
  focus: string | null
): EditorStep {
  const name = filename || step.northPanel.active
  const newFiles = step.files.map((file: any) =>
    file.name === name
      ? {
          ...file,
          focus: focus === null ? file.focus : focus,
        }
      : file
  )

  let northPanel = { ...step.northPanel }
  let southPanel = step.southPanel && {
    ...step.southPanel,
  }
  if (step.northPanel.tabs.includes(name)) {
    northPanel.active = name
  } else if (southPanel) {
    southPanel.active = name
  }
  return { files: newFiles, northPanel, southPanel }
}
