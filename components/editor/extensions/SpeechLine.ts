import { Node } from '@tiptap/core'

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
        // Enter → new paragraph
        Enter: () => {
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
      return ({ node }) => {
        const dom = document.createElement('div')
        dom.className = 'speech-line'

        const nameLabel = document.createElement('span')
        nameLabel.className = 'speech-name-label'
        nameLabel.contentEditable = 'false'
        nameLabel.textContent = node.attrs.character || ''

        const dialogueArea = document.createElement('span')
        dialogueArea.className = 'speech-dialogue-area'
        if (node.content.size === 0) dialogueArea.classList.add('is-empty')

        dom.appendChild(nameLabel)
        dom.appendChild(dialogueArea)

        return {
          dom,
          contentDOM: dialogueArea,
          update(updated) {
            if (updated.type.name !== 'speechLine') return false
            nameLabel.textContent = updated.attrs.character || ''
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
