type GitDiffLine = {
  type: 'add' | 'delete' | 'context'
  content: string
  lineNumber?: number
}

type GitDiffHunk = {
  startOld: number
  lengthOld: number
  startNew: number
  lengthNew: number
  lines: GitDiffLine[]
}

type GitDiffFile = {
  oldPath: string
  newPath: string
  hunks: GitDiffHunk[]
}

export function parseGitDiff(diff: string): GitDiffFile[] {
  const diffLines = diff.split(/\r?\n/)
  const result: GitDiffFile[] = []

  let currentFile: GitDiffFile | null = null
  let currentHunk: GitDiffHunk | null = null

  for (const line of diffLines) {
    if (line.startsWith('diff')) {
      // New file diff
      if (currentFile) {
        result.push(currentFile)
      }
      currentFile = {
        oldPath: '',
        newPath: '',
        hunks: []
      }
    } else if (line.startsWith('---')) {
      // Old file path
      if (currentFile) {
        currentFile.oldPath = line.slice(4).trim()
      }
    } else if (line.startsWith('+++')) {
      // New file path
      if (currentFile) {
        currentFile.newPath = line.slice(4).trim()
      }
    } else if (line.startsWith('@@')) {
      // New hunk
      currentHunk = {
        startOld: 0,
        lengthOld: 0,
        startNew: 0,
        lengthNew: 0,
        lines: []
      }

      if (currentFile && currentHunk) {
        currentFile.hunks.push(currentHunk)
      }

      const hunkHeader = /^@@ -(\d+),(\d+) \+(\d+),(\d+) @@/.exec(line)
      if (hunkHeader) {
        currentHunk.startOld = parseInt(hunkHeader[1], 10)
        currentHunk.lengthOld = parseInt(hunkHeader[2], 10)
        currentHunk.startNew = parseInt(hunkHeader[3], 10)
        currentHunk.lengthNew = parseInt(hunkHeader[4], 10)
      }
    } else if (currentHunk) {
      // Hunk lines
      let lineType: GitDiffLine['type']
      let content: string
      let lineNumber: number | undefined

      if (line.startsWith('+')) {
        lineType = 'add'
        content = line.slice(1)
        lineNumber = currentHunk.startNew++
      } else if (line.startsWith('-')) {
        lineType = 'delete'
        content = line.slice(1)
        lineNumber = currentHunk.startOld++
      } else {
        lineType = 'context'
        content = line.slice(1)
        currentHunk.startOld++
        currentHunk.startNew++
      }

      currentHunk.lines.push({
        type: lineType,
        content,
        lineNumber
      })
    }
  }

  // Save the last file diff
  if (currentFile) {
    result.push(currentFile)
  }

  return result
}

export function createGitDiff(files: GitDiffFile[]): string {
  let diff = ''

  for (const file of files) {
    diff += `diff --git a/${file.oldPath} b/${file.newPath}\n`
    if (file.oldPath === '/dev/null') {
      diff += `new file mode 100644\n`
      // TODO - missing indexs
      diff += `--- ${file.oldPath}\n`
    } else {
      diff += `--- a/${file.oldPath}\n`
    }

    if (file.newPath === '/dev/null') {
      diff += `deleted file mode 100644\n`
      diff += `+++ ${file.newPath}\n`
    } else {
      diff += `+++ b/${file.newPath}\n`
    }

    for (const hunk of file.hunks) {
      diff += `@@ -${hunk.startOld},${hunk.lengthOld} +${hunk.startNew},${hunk.lengthNew} @@\n`

      for (const line of hunk.lines) {
        const prefix =
          line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' '

        diff += `${prefix}${line.content}\n`
      }
    }
  }

  return diff
}

export function excludeFilesByType(
  files: GitDiffFile[],
  excludedTypes: string[]
): GitDiffFile[] {
  return files.filter(file => {
    const fileExtension = file.newPath.split('.').pop() || ''
    return !excludedTypes.includes(fileExtension)
  })
}

export function excludeDeletedFiles(files: GitDiffFile[]): GitDiffFile[] {
  return files.filter(file => file.newPath !== '/dev/null')
}
