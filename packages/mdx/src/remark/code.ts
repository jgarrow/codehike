import { highlight } from "../highlighter"
import { extractLinks } from "./links"
import { NodeInfo, splitChildren } from "./unist-utils"
import { CodeStep } from "../smooth-code"
import { EditorProps } from "../mini-editor"
import {
  getAnnotationsFromMetastring,
  extractAnnotationsFromCode,
  extractJSXAnnotations,
} from "./annotations"
import { Code, mergeFocus } from "../utils"
import { CodeNode, SuperNode } from "./nodes"
import { CodeHikeConfig } from "./config"
import { getCommentData } from "./comment-data"
import { SelectLanguage } from "smooth-code/code-tween"

export function isEditorNode(
  node: SuperNode,
  config: CodeHikeConfig
) {
  if (node.type === "code") {
    const lang = (node.lang as string) || ""
    const shouldSkip = config.skipLanguages.includes(lang)
    return !shouldSkip
  }
  return (
    node.type === "mdxJsxFlowElement" &&
    node.name === "CH.Code"
  )
}

export async function mapAnyCodeNode(
  nodeInfo: NodeInfo,
  config: CodeHikeConfig
) {
  const { node } = nodeInfo
  if (node.type === "code") {
    return mapCode(nodeInfo as NodeInfo<CodeNode>, config)
  } else {
    return mapEditor(nodeInfo, config)
  }
}

type Props = Omit<EditorProps, "codeConfig">

async function mapCode(
  nodeInfo: NodeInfo<CodeNode>,
  config: CodeHikeConfig
): Promise<Props> {
  const file = await mapFile(nodeInfo, config)
  const props: Props = {
    northPanel: {
      tabs: [file.name],
      active: file.name,
      heightRatio: 1,
    },
    files: [file],
  }
  return props
}

export async function mapEditor(
  { node }: NodeInfo,
  config: CodeHikeConfig
): Promise<Props> {
  const [northNodes, southNodes = []] = splitChildren(
    node,
    "thematicBreak"
  )

  const northFiles = await Promise.all(
    northNodes
      .filter(({ node }) => node.type === "code")
      .map((nodeInfo: NodeInfo<CodeNode>) =>
        mapFile(nodeInfo, config)
      )
  )
  const southFiles = await Promise.all(
    southNodes
      .filter(({ node }) => node.type === "code")
      .map((nodeInfo: NodeInfo<CodeNode>) =>
        mapFile(nodeInfo, config)
      )
  )
  const allFiles = [...northFiles, ...southFiles]
  const northActive =
    northFiles.find(f => f.active) || northFiles[0]
  const southActive = southFiles.length
    ? southFiles.find(f => f.active) || southFiles[0]
    : null
  const northLines = northActive.code.lines.length || 1
  const southLines = southActive?.code.lines.length || 0
  const northRatio = southActive
    ? (northLines + 2) / (southLines + northLines + 4)
    : 1
  const southRatio = 1 - northRatio

  const props = {
    northPanel: {
      tabs: northFiles.map(x => x.name) as any,
      active: northActive.name as any,
      heightRatio: northRatio,
    },
    southPanel: southFiles.length
      ? {
          tabs: southFiles.map(x => x.name) as any,
          active: southActive!.name as any,
          heightRatio: southRatio,
        }
      : undefined,
    files: allFiles as any,
  }
  return props
}

export type File = CodeStep & FileOptions & { name: string }

async function mapFile(
  { node, index, parent }: NodeInfo<CodeNode>,
  config: CodeHikeConfig
): Promise<File & { codeInDiffLangs: File[] | [] }> {
  const { theme } = config

  const lang = (node.lang as string) || "text"

  let code = await highlight({
    code: node.value as string,
    lang,
    theme,
  })

  // if the code is a single line with a "from" annotation
  code = await getCodeFromExternalFileIfNeeded(code, config)

  const [commentAnnotations, commentFocus] =
    extractAnnotationsFromCode(code, config)

  const options = parseMetastring(
    typeof node.meta === "string" ? node.meta : ""
  )

  const metaAnnotations = getAnnotationsFromMetastring(
    options as any
  )

  // const linkAnnotations = extractLinks(
  //   node,
  //   index,
  //   parent,
  //   nodeValue as string
  // )

  const jsxAnnotations = extractJSXAnnotations(
    node,
    index,
    parent
  )

  const ogCode = await highlight({
    code: node.value as string,
    lang,
    theme,
  })

  let codeInDiffLangs: Array<File> | [] = []

  // create a new code for each language
  // assuming that the file name is the same for all languages, minus the extension
  if (
    config.selectLanguages &&
    options.multiLanguage &&
    ogCode?.lines.length === 1
  ) {
    codeInDiffLangs = await Promise.all(
      config.selectLanguages.map(async lang => {
        const langCode =
          await getCodeFromExternalFileIfNeeded(
            ogCode,
            config,
            lang.name
          )

        const [commentAnnotations, commentFocus] =
          extractAnnotationsFromCode(langCode, config)

        // TODO: handle annotations that differ
        // from the main code
        const options = parseMetastring(
          typeof node.meta === "string" ? node.meta : ""
        )

        const metaAnnotations =
          getAnnotationsFromMetastring(options as any)

        const jsxAnnotations = extractJSXAnnotations(
          node,
          index,
          parent
        )

        return {
          ...options,
          focus: mergeFocus(options.focus, commentFocus),
          lang,
          code: langCode,
          name: options.name || "",
          annotations: [
            ...metaAnnotations,
            ...commentAnnotations,
            ...jsxAnnotations,
          ],
          selectLanguages:
            options.selectLanguages ??
            config.selectLanguages,
        }
      })
    )
  }

  const file = {
    ...options,
    focus: mergeFocus(options.focus, commentFocus),
    code,
    name: options.name || "",
    annotations: [
      ...metaAnnotations,
      ...commentAnnotations,
      ...jsxAnnotations,
    ],
    codeInDiffLangs,
  }

  return file
}

type FileOptions = {
  focus?: string
  active?: string
  hidden?: boolean
}

function parseMetastring(
  metastring: string
): FileOptions & {
  name: string
  multiLanguage?: boolean
  selectLanguages?: SelectLanguage[]
} {
  const params = metastring.split(" ")
  const options = {} as FileOptions
  let name: string | null = null
  params.forEach(param => {
    const [key, value] = param.split("=")
    if (value != null) {
      ;(options as any)[key] = value
    } else if (name === null) {
      name = key
    } else {
      ;(options as any)[key] = true
    }
  })
  return { name: name || "", ...options }
}

async function getCodeFromExternalFileIfNeeded(
  code: Code,
  config: CodeHikeConfig,
  lang?: string
) {
  if (code?.lines?.length != 1) {
    return code
  }

  const firstLine = code.lines[0]
  const commentData = getCommentData(firstLine, code.lang)

  if (!commentData || commentData.key != "from") {
    return code
  }

  const fileText = firstLine.tokens
    .map(t => t.content)
    .join("")

  const [codePath, range] = commentData.data
    ?.trim()
    .split(/\s+/)

  let codepath = codePath
  let fs, path

  try {
    fs = (await import("fs")).default
    path = (await import("path")).default
    if (!fs || !fs.readFileSync || !path || !path.resolve) {
      throw new Error("fs or path not found")
    }
  } catch (e) {
    e.message = `Code Hike couldn't resolve this annotation:
${fileText}
Looks like node "fs" and "path" modules are not available.`
    throw e
  }

  // if we don't know the path of the mdx file:
  if (config.filepath === undefined) {
    throw new Error(
      `Code Hike couldn't resolve this annotation:
  ${fileText}
  Someone is calling the mdx compile function without setting the path.
  Open an issue on CodeHike's repo for help.`
    )
  }

  if (
    lang &&
    config.selectLanguages &&
    Array.isArray(config.selectLanguages)
  ) {
    const ext = path.extname(codepath)
    const newExt = config.selectLanguages.find(
      language => language.name === lang
    )?.fileExtension

    if (newExt) {
      codepath = codepath.replace(ext, `.${newExt}`)
    }
  }

  const dir = path.dirname(config.filepath)
  const absoluteCodepath = path.resolve(dir, codepath)

  let content: string
  try {
    content = fs.readFileSync(absoluteCodepath, "utf8")
  } catch (e) {
    e.message = `Code Hike couldn't resolve this annotation:
${fileText}
${absoluteCodepath} doesn't exist.`
    throw e
  }

  if (range) {
    const [start, end] = range.split(":")
    const startLine = parseInt(start)
    const endLine = parseInt(end)
    if (isNaN(startLine) || isNaN(endLine)) {
      throw new Error(
        `Code Hike couldn't resolve this annotation:
${fileText}
The range is not valid. Should be something like:
 ${codepath} 2:5`
      )
    }
    const lines = content.split("\n")
    content = lines.slice(startLine - 1, endLine).join("\n")
  }

  return await highlight({
    code: content,
    lang: lang ?? code.lang,
    theme: config.theme,
  })
}
