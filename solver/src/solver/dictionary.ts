import { Trie } from './trie'

let cached: Trie | null = null

export async function loadDictionary(): Promise<Trie> {
  if (cached) return cached

  const response = await fetch('/words/enable.txt')
  const text = await response.text()

  const trie = new Trie()
  for (const line of text.split('\n')) {
    const word = line.trim().toUpperCase()
    if (word.length >= 2 && word.length <= 15 && /^[A-Z]+$/.test(word)) {
      trie.insert(word)
    }
  }

  cached = trie
  return trie
}

export function resetDictionary(): void {
  cached = null
}
