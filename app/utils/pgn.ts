import type { MoveNode } from '~/types/chess'

function appendLine(node: MoveNode, tokens: string[], needsNumber: boolean): void {
  let cur = node
  let showNumber = needsNumber

  while (cur.children.length > 0) {
    const main = cur.children[0]

    if (main.color === 'w') {
      tokens.push(`${main.moveNumber}.`)
    }
    else if (showNumber) {
      tokens.push(`${main.moveNumber}...`)
    }
    showNumber = false

    tokens.push(main.move!.san)

    // Variations at this position (alternatives to main)
    for (const alt of cur.children.slice(1)) {
      const varTokens: string[] = []
      if (alt.color === 'w') {
        varTokens.push(`${alt.moveNumber}.`)
      }
      else {
        varTokens.push(`${alt.moveNumber}...`)
      }
      varTokens.push(alt.move!.san)
      appendLine(alt, varTokens, false)
      tokens.push(`(${varTokens.join(' ')})`)
      showNumber = true // black's next main move needs number after variation block
    }

    cur = main
  }
}

export function generatePgn(root: MoveNode): string {
  const tokens: string[] = []
  appendLine(root, tokens, true)
  return tokens.join(' ')
}
