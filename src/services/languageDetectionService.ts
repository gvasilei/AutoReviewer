import { Option, Context, Effect, Layer } from 'effect'

const makeLanguageDetectionService = Effect.sync(() => {
  return {
    detectLanguage: (filename: string): Option.Option<Language> => {
      const extension = getFileExtension(filename)
      return Option.fromNullable(extensionToLanguageMap[extension as LanguageKey])
    }
  }
})

export class LanguageDetectionService extends Context.Tag('LanguageDetectionService')<
  LanguageDetectionService,
  Effect.Effect.Success<typeof makeLanguageDetectionService>
>() {
  static Live = Layer.effect(this, makeLanguageDetectionService)
}

const getFileExtension = (filename: string): string => {
  const extension = filename.split('.').pop()
  return extension ? extension : ''
}

const extensionToLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  go: 'go',
  rb: 'ruby',
  cs: 'csharp',
  java: 'java',
  php: 'php',
  rs: 'rust',
  swift: 'swift',
  cpp: 'cpp',
  c: 'c',
  m: 'objective-c',
  mm: 'objective-cpp',
  h: 'c',
  hpp: 'cpp',
  hxx: 'cpp',
  hh: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  sass: 'sass',
  styl: 'stylus',
  vue: 'vue',
  svelte: 'svelte',
  jsx: 'jsx',
  tsx: 'tsx',
  md: 'markdown',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  toml: 'toml',
  sh: 'shell',
  clj: 'clojure',
  cljs: 'clojure',
  cljc: 'clojure',
  edn: 'clojure',
  lua: 'lua',
  sql: 'sql',
  r: 'r',
  kt: 'kotlin',
  kts: 'kotlin',
  ktm: 'kotlin',
  ktx: 'kotlin',
  gradle: 'groovy',
  tf: 'terraform',
  scala: 'scala',
  sc: 'scala'
} as const

type LanguageKey = keyof typeof extensionToLanguageMap
export type Language = (typeof extensionToLanguageMap)[LanguageKey]
