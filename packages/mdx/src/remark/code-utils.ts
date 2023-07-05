import { Code } from "utils"
import { getCommentData } from "./comment-data"
import { CodeHikeConfig } from "./config"
import { HighlightedLine } from "smooth-code/partial-step-parser"
import { highlight } from "../highlighter"

// TODO: handle additional languages passed by user via config
// left: language file extension
// right: language name for syntax highlighting
export const LANGUAGE_MAP = {
  abap: 'abap',
  'actionscript-3': 'actionscript-3',
  ada: 'ada',
  apache: 'apache',
  apex: 'apex',
  apl: 'apl',
  applescript: 'applescript',
  ara: 'ara',
  asm: 'asm',
  astro: 'astro',
  awk: 'awk',
  ballerina: 'ballerina',
  bat: 'bat',
  batch: 'batch',
  berry: 'berry',
  be: 'be',
  bibtex: 'bibtex',
  bicep: 'bicep',
  blade: 'blade',
  c: 'c',
  cadence: 'cadence',
  cdc: 'cdc',
  clarity: 'clarity',
  clojure: 'clojure',
  clj: 'clj',
  cmake: 'cmake',
  cobol: 'cobol',
  codeql: 'codeql',
  ql: 'ql',
  coffee: 'coffee',
  cpp: 'cpp',
  crystal: 'crystal',
  csharp: 'csharp',
  'c#': 'c#',
  cs: 'cs',
  css: 'css',
  cue: 'cue',
  d: 'd',
  dart: 'dart',
  dax: 'dax',
  diff: 'diff',
  docker: 'docker',
  dockerfile: 'dockerfile',
  'dream-maker': 'dream-maker',
  elixir: 'elixir',
  elm: 'elm',
  erb: 'erb',
  erlang: 'erlang',
  erl: 'erl',
  fish: 'fish',
  fsharp: 'fsharp',
  'f#': 'f#',
  fs: 'fs',
  gdresource: 'gdresource',
  gdscript: 'gdscript',
  gdshader: 'gdshader',
  gherkin: 'gherkin',
  'git-commit': 'git-commit',
  'git-rebase': 'git-rebase',
  glsl: 'glsl',
  gnuplot: 'gnuplot',
  go: 'go',
  graphql: 'graphql',
  groovy: 'groovy',
  hack: 'hack',
  haml: 'haml',
  handlebars: 'handlebars',
  hbs: 'hbs',
  haskell: 'haskell',
  hs: 'hs',
  hcl: 'hcl',
  hlsl: 'hlsl',
  html: 'html',
  http: 'http',
  imba: 'imba',
  ini: 'ini',
  properties: 'properties',
  java: 'java',
  javascript: 'javascript',
  js: 'js',
  'jinja-html': 'jinja-html',
  jison: 'jison',
  json: 'json',
  json5: 'json5',
  jsonc: 'jsonc',
  jsonnet: 'jsonnet',
  jssm: 'jssm',
  fsl: 'fsl',
  jsx: 'jsx',
  julia: 'julia',
  kotlin: 'kotlin',
  kusto: 'kusto',
  kql: 'kql',
  latex: 'latex',
  less: 'less',
  liquid: 'liquid',
  lisp: 'lisp',
  logo: 'logo',
  lua: 'lua',
  make: 'make',
  makefile: 'makefile',
  markdown: 'markdown',
  md: 'md',
  marko: 'marko',
  matlab: 'matlab',
  mdx: 'mdx',
  mermaid: 'mermaid',
  nginx: 'nginx',
  nim: 'nim',
  nix: 'nix',
  'objective-c': 'objective-c',
  objc: 'objc',
  'objective-cpp': 'objective-cpp',
  ocaml: 'ocaml',
  pascal: 'pascal',
  perl: 'perl',
  php: 'php',
  plsql: 'plsql',
  postcss: 'postcss',
  powerquery: 'powerquery',
  powershell: 'powershell',
  ps: 'ps',
  ps1: 'ps1',
  prisma: 'prisma',
  prolog: 'prolog',
  proto: 'proto',
  pug: 'pug',
  jade: 'jade',
  puppet: 'puppet',
  purescript: 'purescript',
  python: 'python',
  py: 'py',
  r: 'r',
  raku: 'raku',
  perl6: 'perl6',
  razor: 'razor',
  reg: 'reg',
  rel: 'rel',
  riscv: 'riscv',
  rst: 'rst',
  ruby: 'ruby',
  rb: 'rb',
  rust: 'rust',
  rs: 'rs',
  sas: 'sas',
  sass: 'sass',
  scala: 'scala',
  scheme: 'scheme',
  scss: 'scss',
  shaderlab: 'shaderlab',
  shader: 'shader',
  shellscript: 'shellscript',
  bash: 'bash',
  console: 'console',
  sh: 'sh',
  shell: 'shell',
  zsh: 'zsh',
  smalltalk: 'smalltalk',
  solidity: 'solidity',
  sparql: 'sparql',
  sql: 'sql',
  'ssh-config': 'ssh-config',
  stata: 'stata',
  stylus: 'stylus',
  styl: 'styl',
  svelte: 'svelte',
  swift: 'swift',
  'system-verilog': 'system-verilog',
  tasl: 'tasl',
  tcl: 'tcl',
  tex: 'tex',
  toml: 'toml',
  tsx: 'tsx',
  turtle: 'turtle',
  twig: 'twig',
  typescript: 'typescript',
  ts: 'ts',
  v: 'v',
  vb: 'vb',
  cmd: 'cmd',
  verilog: 'verilog',
  vhdl: 'vhdl',
  viml: 'viml',
  vim: 'vim',
  vimscript: 'vimscript',
  'vue-html': 'vue-html',
  vue: 'vue',
  wasm: 'wasm',
  wenyan: '文言',
  wgsl: 'wgsl',
  xml: 'xml',
  xsl: 'xsl',
  yaml: 'yaml',
  yml: 'yml',
  zenscript: 'zenscript'
};

type ExternalCodeCommentData = {
  firstLine: HighlightedLine
  commentData: ReturnType<typeof getCommentData>
}

function getExternalCodeComment(
  code: Code
): ExternalCodeCommentData | Code {
  if (code?.lines.length !== 1) {
    return code
  }

  const firstLine = code.lines[0]
  const commentData = getCommentData(firstLine, code.lang)

  if (!commentData || commentData.key !== "from") {
    return code
  }

  return { firstLine, commentData }
}

async function importFsAndPath(annotation: string) {
  let fs, path

  try {
    fs = (await import("fs")).default
    path = (await import("path")).default
    if (!fs || !fs.readFileSync || !path || !path.resolve) {
      throw new Error("fs or path not found")
    }
  } catch (e) {
    e.message = `Code Hike couldn't resolve this annotation:
${annotation}
Looks like node "fs" and "path" modules are not available.`
    throw e
  }

  return { fs, path }
}

async function getContentFromFile({
  fs,
  absoluteCodepath,
  codepath,
  fileText,
  range,
}) {
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

  return content
}

type getOtherLanguageCodeArgs = {
  codepath: string
  config: CodeHikeConfig
  fileText: string
  range: any

  // fs and path NodeJS modules
  fs: any
  path: any
}

function isExternalCodeCommentData(
  obj: any
): obj is ExternalCodeCommentData {
  return "firstLine" in obj && "commentData" in obj
}

export async function getCodeFromExternalFileIfNeeded(
  code: Code,
  config: CodeHikeConfig,
  multiLanguage: boolean = false,
  lang?: string
) {
  const codeCommentData = getExternalCodeComment(code)

  if (!isExternalCodeCommentData(codeCommentData)) {
    return { code, codeInDiffLangs: [] }
  }

  const { firstLine, commentData } = codeCommentData
  const fileText = firstLine.tokens
    .map(t => t.content)
    .join("")
  const [codepath, range] = commentData.data
    ?.trim()
    .split(/\s+/)
  const { fs, path } = await importFsAndPath(fileText)

  // if we don't know the path of the mdx file:
  if (config.filepath === undefined) {
    throw new Error(
      `Code Hike couldn't resolve this annotation:
  ${fileText}
  Someone is calling the mdx compile function without setting the path.
  Open an issue on CodeHike's repo for help.`
    )
  }

  const dir = path.dirname(config.filepath)
  const absoluteCodepath = path.resolve(dir, codepath)

  let codeInDiffLangs: Code[] | [] = []

  if (multiLanguage) {
    const sampleCodeDir = path.dirname(absoluteCodepath)
    codeInDiffLangs = await Promise.all<Code>(
      fs.readdirSync(sampleCodeDir).map(async file => {
        const ext = path.extname(file)
        const name = path.basename(file, ext)
        const filepath = path.resolve(sampleCodeDir, file)
        const content = await getContentFromFile({
          fs,
          absoluteCodepath: filepath,
          codepath,
          fileText,
          range,
        })

        return await highlight({
          code: content,
          lang: LANGUAGE_MAP[ext.slice(1)],
          theme: config.theme,
        })
      })
    )
  }

  const content = await getContentFromFile({
    fs,
    absoluteCodepath,
    codepath,
    fileText,
    range,
  })

  return {
    code: await highlight({
      code: content,
      lang: lang ?? code.lang,
      theme: config.theme,
    }),
    codeInDiffLangs,
  }
}
