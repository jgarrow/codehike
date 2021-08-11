import React from "react"
import { Dimensions } from "./use-dimensions"
import {
  CodeStep,
  AnnotatedTokenGroups,
} from "./step-parser"
import { SmoothContainer } from "./smooth-container"
import { tween } from "./tween"
import { FullTween, map, Tween } from "@code-hike/utils"

type SmoothLinesProps = {
  progress: number
  dimensions: Dimensions
  minZoom?: number
  maxZoom?: number
  center?: boolean
  codeStep: CodeStep
}

export function SmoothLines(props: SmoothLinesProps) {
  return (
    <SmoothContainer {...props}>
      {focusWidth => (
        <Lines
          codeStep={props.codeStep}
          focusWidth={focusWidth}
          lineHeight={props.dimensions!.lineHeight}
          progress={props.progress}
        />
      )}
    </SmoothContainer>
  )
}

function Lines({
  codeStep,
  progress,
  focusWidth,
  lineHeight,
}: {
  codeStep: CodeStep
  focusWidth: number
  lineHeight: number
  progress: number
}) {
  const groups =
    progress < 0.5
      ? codeStep.groups.prev
      : codeStep.groups.next

  return (
    <>
      {groups.map((group, i) => {
        if (!group.annotation) {
          return (
            <LineGroup
              lines={group.lines}
              t={progress}
              focusWidth={focusWidth}
              lineHeight={lineHeight}
              key={i}
            />
          )
        }

        const startY = tween(
          group.lines[0]!.tweenY,
          progress
        )

        const lineCount =
          group.annotation.lineNumbers.end -
          group.annotation.lineNumbers.start +
          1

        const Component = group.annotation.Component
        return (
          <Component
            style={{
              position: "absolute",
              height: lineCount * lineHeight,
              width: "100%",
              transform: `translateY(${
                startY * lineHeight
              }px)`,
            }}
            key={i}
          >
            <LineGroup
              lines={group.lines}
              t={progress}
              focusWidth={focusWidth}
              lineHeight={lineHeight}
              startY={startY}
            />
          </Component>
        )
      })}
    </>
  )
}

type CodeLine = CodeStep["groups"]["prev"][number]["lines"][number]

function LineGroup({
  lines,
  focusWidth,
  lineHeight,
  t,
  startY = 0,
}: {
  lines: CodeLine[]
  focusWidth: number
  lineHeight: number
  t: number
  startY?: number
}) {
  return (
    <>
      {lines.map((line, key) => {
        const { tweenX, tweenY, focused } = line
        const dx = tween(tweenX, t)
        const dy = tween(tweenY, t)
        const opacity = getOpacity(focused, t, dx)

        return (
          <LineContainer
            key={key}
            dx={dx * focusWidth}
            dy={(dy - startY) * lineHeight}
            width={focusWidth}
            opacity={opacity}
          >
            <LineContent line={line} progress={t} dx={dx} />
          </LineContainer>
        )
      })}
    </>
  )
}

function LineContent({
  line,
  progress,
  dx,
}: {
  line: CodeLine
  progress: number
  dx: number
}) {
  return (
    <div
      style={{
        display: "inline-block",
        width: "100%",
      }}
    >
      {line.annotatedGroups.map((annotatedGroup, i) => (
        <AnnotatedTokens
          annotatedGroup={annotatedGroup}
          progress={progress}
          dx={dx}
          key={i}
        />
      ))}
      <br />
    </div>
  )
}

function AnnotatedTokens({
  annotatedGroup,
  progress,
  dx,
}: {
  annotatedGroup: Tween<AnnotatedTokenGroups>
  progress: number
  dx: number
}) {
  const annotated =
    progress < 0.5
      ? annotatedGroup.prev
      : annotatedGroup.next
  const tokenGroups = annotated?.groups || []
  const Component = annotated?.annotation?.Component
  const children = tokenGroups.map((group, i) => {
    const opacity = getOpacity(group.focused, progress, dx)
    return (
      <span style={{ opacity }} key={i + 1}>
        {group.element}
      </span>
    )
  })

  return Component ? (
    <Component children={children} />
  ) : (
    <>{children}</>
  )
}

function LineContainer({
  children,
  dx,
  dy,
  opacity,
  width,
}: {
  children: React.ReactNode
  dx: number
  dy: number
  width: number
  opacity: number
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translate(${dx}px, ${dy}px)`,
        width,
        display: opacity <= 0 ? "none" : undefined,
      }}
    >
      {children}
    </div>
  )
}

const OFF_OPACITY = 0.33

function getOpacity(
  focused: FullTween<boolean>,
  progress: number,
  dx: number
) {
  return (
    tween(
      {
        fixed: false,
        extremes: [
          focused.prev ? 0.99 : OFF_OPACITY,
          focused.next ? 0.99 : OFF_OPACITY,
        ],
        interval: [0, 1],
      },
      progress
    ) -
    Math.abs(dx) * 1
  )
}
