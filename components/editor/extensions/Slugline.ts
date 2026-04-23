import { Node, mergeAttributes, InputRule, CommandProps } from '@tiptap/core'
import { NodeType } from '@tiptap/pm/model'

function sluglineInputRule(type: NodeType) {
  return new InputRule({
    find: /^(@|##)\s$/,
    handler({ state, range }) {
      const { tr } = state
      const $pos = state.doc.resolve(range.from)
      if (!$pos.node(-1).canReplaceWith($pos.index(-1), $pos.indexAfter(-1), type)) return null
      tr.setBlockType(range.from, range.to, type).deleteRange(range.from, range.to)
    },
  })
}

export const Slugline = Node.create({
  name: 'slugline',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [
      { tag: 'h2[data-type="slugline"]' },
      { tag: 'h2' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['h2', mergeAttributes(HTMLAttributes, { 'data-type': 'slugline', class: 'slugline' }), 0]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { $from } = this.editor.state.selection
        if ($from.parent.type.name !== 'slugline') return false
        const end = $from.after()
        return this.editor
          .chain()
          .insertContentAt(end, { type: 'paragraph' })
          .setTextSelection(end + 1)
          .run()
      },
    }
  },

  addCommands() {
    return {
      toggleSlugline:
        () =>
        ({ commands, state }: CommandProps) =>
          state.selection.$from.parent.type.name === 'slugline'
            ? commands.setNode('paragraph')
            : commands.setNode('slugline'),
    } as any
  },

  addInputRules() {
    return [sluglineInputRule(this.type)]
  },
})
