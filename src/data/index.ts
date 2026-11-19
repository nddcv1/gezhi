import type { Question, VideoItem } from '../lib/types'
import rawContent from './content.json'
import rawDaily from './daily.json'

export const builtinItems: readonly VideoItem[] = (rawContent as unknown as { items: VideoItem[] }).items
export const questions: readonly Question[] = (rawDaily as unknown as { questions: Question[] }).questions
