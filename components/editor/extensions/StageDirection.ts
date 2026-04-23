import { Node, mergeAttributes } from '@tiptap/core'

export const StageDirection = Node.create({
  name: 'stageDirection',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'p[data-type="stage-direction"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'p',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'stage-direction',
        class: 'stage-direction',
      }),
      0,
    ]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { $from } = this.editor.state.selection
        if ($from.parent.type.name !== 'stageDirection') return false
        const end = $from.after()
        return this.editor
          .chain()
          .insertContentAt(end, { type: 'paragraph' })
          .setTextSelection(end + 1)
          .run()
      },
    }
  },
})
