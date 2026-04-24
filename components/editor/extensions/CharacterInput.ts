import { Node, InputRule } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet, EditorView } from '@tiptap/pm/view'

const ghostKey = new PluginKey('characterInputGhost')

export function createCharacterInput(charactersRef: { current: string[] }) {
  return Node.create({
    name: 'characterInput',
    group: 'block',
    content: 'inline*',
    defining: true,

    parseHTML() {
      return [] // transient node — not persisted; SpeechLine is the serialized form
    },

    renderHTML() {
      return ['p', { class: 'speech-name-input-block', 'data-type': 'character-input' }, 0]
    },

    addKeyboardShortcuts() {
      return {
        // Tab / ArrowRight at end → accept ghost text
        Tab: () => {
          const { $from, empty } = this.editor.state.selection
          if ($from.parent.type.name !== 'characterInput') return false
          if (!empty || $from.pos !== $from.end()) return false
          const ghost = getGhost($from.parent.textContent, charactersRef.current)
          if (!ghost) return false
          return this.editor.commands.insertContent(ghost)
        },

        ArrowRight: () => {
          const { $from, empty } = this.editor.state.selection
          if ($from.parent.type.name !== 'characterInput') return false
          if (!empty || $from.pos !== $from.end()) return false
          const ghost = getGhost($from.parent.textContent, charactersRef.current)
          if (!ghost) return false
          return this.editor.commands.insertContent(ghost)
        },

        // Enter → commit name, create SpeechLine
        Enter: () => {
          const { $from } = this.editor.state.selection
          if ($from.parent.type.name !== 'characterInput') return false
          convertToSpeechLine(this.editor.view, charactersRef)
          return true
        },

        // Backspace on empty → paragraph
        Backspace: () => {
          const { $from } = this.editor.state.selection
          if ($from.parent.type.name !== 'characterInput') return false
          if ($from.parent.textContent !== '') return false
          return this.editor.chain().setNode('paragraph').run()
        },

        // Escape → paragraph
        Escape: () => {
          const { $from } = this.editor.state.selection
          if ($from.parent.type.name !== 'characterInput') return false
          return this.editor.chain().setNode('paragraph').run()
        },
      }
    },

    addInputRules() {
      return [
        new InputRule({
          find: /^\[\s?$/,
          handler: ({ state, range }) => {
            const { tr } = state
            const $pos = state.doc.resolve(range.from)
            if (!$pos.node(-1).canReplaceWith($pos.index(-1), $pos.indexAfter(-1), this.type))
              return null
            tr.setBlockType(range.from, range.to, this.type)
              .deleteRange(range.from, range.to)
          },
        }),
      ]
    },

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: ghostKey,
          state: {
            init: () => DecorationSet.empty,
            apply: (_tr, _set, _old, newState) => {
              const { $from, empty } = newState.selection
              if (!empty) return DecorationSet.empty
              if ($from.parent.type.name !== 'characterInput') return DecorationSet.empty

              const nodeEnd = $from.end()
              if ($from.pos !== nodeEnd) return DecorationSet.empty

              const typed = $from.parent.textContent
              const ghost = getGhost(typed, charactersRef.current)
              if (!ghost) return DecorationSet.empty

              const widget = Decoration.widget(
                nodeEnd,
                () => {
                  const span = document.createElement('span')
                  span.className = 'speech-name-ghost'
                  span.setAttribute('contenteditable', 'false')
                  span.textContent = ghost
                  return span
                },
                { side: 1 }
              )
              return DecorationSet.create(newState.doc, [widget])
            },
          },
          props: {
            decorations(state) {
              return this.getState(state)
            },
            handleDOMEvents: {
              keydown(view: EditorView, event: Event) {
                const ke = event as KeyboardEvent
                if (ke.key !== 'Enter' || !ke.isComposing) return false
                // IME composition: schedule conversion after IME commits
                setTimeout(() => {
                  convertToSpeechLine(view, charactersRef)
                }, 0)
                return false
              },
            },
          },
        }),
      ]
    },
  })
}

function convertToSpeechLine(view: EditorView, charactersRef: { current: string[] }) {
  const { state } = view
  const { $from } = state.selection
  if ($from.parent.type.name !== 'characterInput') return

  const typed = $from.parent.textContent
  const ghost = getGhost(typed, charactersRef.current)
  const character = ghost ? typed + ghost : typed

  const pos = $from.before()
  const speechLineType = state.schema.nodes.speechLine
  if (!speechLineType) return

  const newNode = speechLineType.create({ character })
  const tr = state.tr.replaceWith(pos, $from.after(), newNode)
  tr.setSelection(TextSelection.create(tr.doc, pos + 1))
  view.dispatch(tr)
}

function getGhost(typed: string, characters: string[]): string {
  if (!typed) return ''
  const match = characters.find(
    (c) => c.toLowerCase().startsWith(typed.toLowerCase()) && c.length > typed.length
  )
  return match ? match.slice(typed.length) : ''
}
