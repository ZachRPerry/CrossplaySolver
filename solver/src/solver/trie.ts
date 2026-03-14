export class TrieNode {
  children: Map<string, TrieNode> = new Map()
  isTerminal = false
}

export class Trie {
  root = new TrieNode()

  insert(word: string): void {
    let node = this.root
    for (const ch of word) {
      let child = node.children.get(ch)
      if (!child) {
        child = new TrieNode()
        node.children.set(ch, child)
      }
      node = child
    }
    node.isTerminal = true
  }

  hasWord(word: string): boolean {
    const node = this._traverse(word)
    return node?.isTerminal === true
  }

  hasPrefix(prefix: string): boolean {
    return this._traverse(prefix) !== null
  }

  getNode(prefix: string): TrieNode | null {
    return this._traverse(prefix)
  }

  private _traverse(str: string): TrieNode | null {
    let node = this.root
    for (const ch of str) {
      const child = node.children.get(ch)
      if (!child) return null
      node = child
    }
    return node
  }
}
