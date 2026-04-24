import { Node, mergeAttributes, InputRule } from '@tiptap/core'

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
      Backspace: () => {
        const { $from } = this.editor.state.selection
        if ($from.parent.type.name !== 'stageDirection') return false
        if ($from.parent.textContent !== '') return false
        return this.editor.chain().setNode('paragraph').run()
      },
    }
  },

  addInputRules() {
    return [
      new InputRule({
        find: /^\(\s?$/,
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
})
