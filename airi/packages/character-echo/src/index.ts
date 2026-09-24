/**
 * Echo Character Package
 *
 * Main exports for Echo - The Living Memory System character implementation
 */

export { EchoCharacter } from './character'
export type { CognitiveState, EchoConfig, EchoReflection } from './config'
export { defaultEchoConfig, initialCognitiveState } from './config'
export {
  ECHO_COGNITIVE_INSTRUCTIONS,
  ECHO_REFLECTION_TEMPLATE,
  ECHO_SYSTEM_PROMPT,
} from './prompts'
export type { EchoEvent, EchoWebSocketEvents } from './types'
