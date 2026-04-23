import { Node, mergeAttributes } from '@tiptap/core'

export const Dialogue = Node.create({
  name: 'dialogue',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'p[data-type="dialogue"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'p',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'dialogue',
        class: 'dialogue',
      }),
      0,
    ]
  },

  addKeyboardShortcuts() {
    return {
      // Enter → 다음 paragraph
      Enter: () => {
        const { $from } = this.editor.state.selection
        if ($from.parent.type.name !== 'dialogue') return false
        const end = $from.after()
        return this.editor
          .chain()
          .insertContentAt(end, { type: 'paragraph' })
          .setTextSelection(end + 1)
          .run()
      },

      // Backspace on empty → paragraph
      Backspace: () => {
        const { $from } = this.editor.state.selection
        if ($from.parent.type.name !== 'dialogue') return false
        if ($from.parent.textContent !== '') return false
        return this.editor.chain().setNode('paragraph').run()
      },
    }
  },
})
