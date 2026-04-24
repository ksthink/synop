import { Node } from '@tiptap/core'
import type { Editor } from '@tiptap/core'
import type { Node as PmNode } from '@tiptap/pm/model'

export function createSpeechLine() {
  return Node.create({
    name: 'speechLine',
    group: 'block',
    content: 'inline*',
    defining: true,

    addAttributes() {
      return { character: { default: '' } }
    },

    parseHTML() {
      return [{ tag: 'div[data-type="speech-line"]' }]
    },

    renderHTML({ node, HTMLAttributes }) {
      return [
        'div',
        {
          ...HTMLAttributes,
          'data-type': 'speech-line',
          class: 'speech-line',
          'data-character': node.attrs.character,
        },
        0,
      ]
    },

    addKeyboardShortcuts() {
      return {
        // Enter → hard break (stay in dialogue column)
        Enter: () => {
          const { $from } = this.editor.state.selection
          if ($from.parent.type.name !== 'speechLine') return false
          return this.editor.commands.setHardBreak()
        },
        // Ctrl+Enter → exit speechLine, new paragraph
        'Ctrl-Enter': () => {
          const { $from } = this.editor.state.selection
          if ($from.parent.type.name !== 'speechLine') return false
          const end = $from.after()
          return this.editor
            .chain()
            .insertContentAt(end, { type: 'paragraph' })
            .setTextSelection(end + 1)
            .run()
        },
        // Backspace on empty dialogue → paragraph
        Backspace: () => {
          const { $from } = this.editor.state.selection
          if ($from.parent.type.name !== 'speechLine') return false
          if ($from.parent.textContent !== '') return false
          return this.editor.chain().setNode('paragraph').run()
        },
      }
    },

    addNodeView() {
      return ({
        node,
        editor,
        getPos,
      }: {
        node: PmNode
        editor: Editor
        getPos: () => number | undefined
      }) => {
        let currentCharacter = node.attrs.character as string

        const dom = document.createElement('div')
        dom.className = 'speech-line'

        const nameLabel = document.createElement('span')
        nameLabel.className = 'speech-name-label'
        nameLabel.contentEditable = 'true'
        nameLabel.spellcheck = false
        nameLabel.textContent = currentCharacter

        const dialogueArea = document.createElement('span')
        dialogueArea.className = 'speech-dialogue-area'
        if (node.content.size === 0) dialogueArea.classList.add('is-empty')

        nameLabel.addEventListener('keydown', (e: KeyboardEvent) => {
          e.stopPropagation() // prevent ProseMirror from handling these keystrokes
          if (e.key === 'Enter') {
            e.preventDefault()
            nameLabel.blur()
            // move ProseMirror focus to dialogue area
            editor.commands.focus()
          } else if (e.key === 'Escape') {
            nameLabel.textContent = currentCharacter
            nameLabel.blur()
            editor.commands.focus()
          }
        })

        nameLabel.addEventListener('blur', () => {
          const newName = (nameLabel.textContent ?? '').trim()
          if (newName === currentCharacter) return
          const pos = getPos()
          if (pos === undefined) return
          editor.view.dispatch(
            editor.view.state.tr.setNodeMarkup(pos, undefined, { character: newName })
          )
        })

        dom.appendChild(nameLabel)
        dom.appendChild(dialogueArea)

        return {
          dom,
          contentDOM: dialogueArea,
          update(updated: PmNode) {
            if (updated.type.name !== 'speechLine') return false
            currentCharacter = updated.attrs.character as string
            // only update DOM if not currently focused (avoid cursor jumping)
            if (document.activeElement !== nameLabel) {
              nameLabel.textContent = currentCharacter
            }
            if (updated.content.size === 0) {
              dialogueArea.classList.add('is-empty')
            } else {
              dialogueArea.classList.remove('is-empty')
            }
            return true
          },
        }
      }
    },
  })
}
