import React from "react"
import { EditorProps, EditorStep } from "../mini-editor"
import {
  InnerCode,
  LanguageContext,
  updateEditorStep,
} from "./code"
import { Scroller, Step as ScrollerStep } from "../scroller"
import { Preview, PresetConfig } from "./preview"
import { LinkableSection } from "./section"
import { extractPreviewSteps } from "./steps"
import { Swap } from "./ssmq"
import { StaticStepContext } from "./slots"

type ScrollycodingProps = {
  children: React.ReactNode
  editorSteps: EditorStep[]
  codeConfig: EditorProps["codeConfig"]
  start?: number
  presetConfig?: PresetConfig
  className?: string
  style?: React.CSSProperties
  hasPreviewSteps?: boolean
  otherCodeConfig?: Partial<EditorProps["codeConfig"]>
}

export function Scrollycoding(props) {
  const codeConfig = {
    ...props.codeConfig,
    ...props?.otherCodeConfig,
  }

  return (
    <Swap
      match={[
        [
          codeConfig.staticMediaQuery,
          <StaticScrollycoding
            {...props}
            codeConfig={codeConfig}
          />,
        ],
        [
          "default",
          <DynamicScrollycoding
            {...props}
            codeConfig={codeConfig}
          />,
        ],
      ]}
    />
  )
}

function StaticScrollycoding({
  children,
  hasPreviewSteps,
  editorSteps,
  ...rest
}: ScrollycodingProps) {
  const { stepsChildren, previewChildren } =
    extractPreviewSteps(children, hasPreviewSteps)
  return (
    <section
      className="ch-scrollycoding-static"
      data-ch-theme={rest?.codeConfig?.themeName}
    >
      {stepsChildren.map((children, i) => (
        <StaticSection
          key={i}
          editorStep={editorSteps[i]}
          previewStep={
            previewChildren && previewChildren[i]
          }
          allProps={rest}
        >
          {children}
        </StaticSection>
      ))}
    </section>
  )
}

function StaticSection({
  editorStep,
  previewStep,
  allProps,
  children,
}: {
  editorStep: EditorStep
  previewStep: React.ReactNode
  children: React.ReactNode
  allProps: any
}) {
  const [step, setStep] = React.useState({
    ...editorStep,
    ...allProps,
  })

  const resetFocus = () =>
    setStep({
      ...editorStep,
      ...allProps,
    })
  const setFocus = ({
    fileName,
    focus,
    id,
  }: {
    fileName?: string
    focus: string | null
    id: string
  }) => {
    const newStep = updateEditorStep(step, fileName, focus)

    setStep({
      ...step,
      ...newStep,
      selectedId: id,
    })
  }

  return (
    <StaticStepContext.Provider
      value={{
        editorStep: step,
        previewStep: previewStep,
        allProps,
        setFocus,
      }}
    >
      <LinkableSection
        onActivation={setFocus}
        onReset={resetFocus}
      >
        {children}
      </LinkableSection>
    </StaticStepContext.Provider>
  )
}

function DynamicScrollycoding({
  children,
  editorSteps,
  codeConfig,
  presetConfig,
  start = 0,
  className,
  style,
  hasPreviewSteps,
  ...rest
}: ScrollycodingProps) {
  const { stepsChildren, previewChildren } =
    extractPreviewSteps(children, hasPreviewSteps)

  const withPreview = presetConfig || hasPreviewSteps

  const [state, setState] = React.useState({
    stepIndex: start,
    step: editorSteps[start],
  })

  const tab = state.step
  const [language, setLanguage] = React.useState(
    tab.files[0].code.lang
  )

  function onStepChange(index: number) {
    setState({ stepIndex: index, step: editorSteps[index] })
  }

  function onTabClick(filename: string) {
    const newStep = updateEditorStep(
      state.step,
      filename,
      null
    )
    setState({ ...state, step: newStep })
  }

  function onLinkActivation(
    stepIndex: number,
    filename: string | undefined,
    focus: string | null
  ) {
    const newStep = updateEditorStep(
      editorSteps[stepIndex],
      filename,
      focus
    )
    setState({ ...state, stepIndex, step: newStep })
  }

  return (
    <section
      className={`ch-scrollycoding ${
        withPreview ? "ch-scrollycoding-with-preview" : ""
      } ${className || ""}`}
      style={style}
      data-ch-theme={codeConfig?.themeName}
    >
      <div className="ch-scrollycoding-content">
        <Scroller
          onStepChange={onStepChange}
          triggerPosition={codeConfig?.triggerPosition}
        >
          {stepsChildren.map((children, i) => (
            <ScrollerStep
              as="div"
              key={i}
              index={i}
              onClick={() => onStepChange(i)}
              className="ch-scrollycoding-step-content"
              data-selected={
                i === state.stepIndex ? "true" : undefined
              }
            >
              <LinkableSection
                onActivation={({ fileName, focus }) => {
                  onLinkActivation(i, fileName, focus)
                }}
                onReset={() => {
                  onStepChange(i)
                }}
              >
                {children}
              </LinkableSection>
            </ScrollerStep>
          ))}
        </Scroller>
      </div>
      <div className="ch-scrollycoding-sticker">
        <LanguageContext.Provider
          value={{ language, setLanguage }}
        >
          <InnerCode
            showExpandButton={true}
            {...rest}
            {...(tab as any)}
            codeConfig={codeConfig}
            onTabClick={onTabClick}
          />
        </LanguageContext.Provider>
        {presetConfig ? (
          <Preview
            className="ch-scrollycoding-preview"
            files={tab.files}
            presetConfig={presetConfig}
          />
        ) : hasPreviewSteps ? (
          <Preview
            className="ch-scrollycoding-preview"
            {...previewChildren[state.stepIndex]["props"]}
          />
        ) : null}
      </div>
    </section>
  )
}
