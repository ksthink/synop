import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import { NodeType } from '@tiptap/pm/model'

function transitionInputRule(type: NodeType) {
  return new InputRule({
    find: /^>>\s$/,
    handler({ state, range }) {
      const { tr } = state
      const $pos = state.doc.resolve(range.from)
      if (!$pos.node(-1).canReplaceWith($pos.index(-1), $pos.indexAfter(-1), type)) return null
      tr.setBlockType(range.from, range.to, type).deleteRange(range.from, range.to)
    },
  })
}

export const Transition = Node.create({
  name: 'transition',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'p[data-type="transition"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { 'data-type': 'transition', class: 'transition' }), 0]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { $from } = this.editor.state.selection
        if ($from.parent.type.name !== 'transition') return false
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
      toggleTransition:
        () =>
        ({ commands, state }: any) =>
          state.selection.$from.parent.type.name === 'transition'
            ? commands.setNode('paragraph')
            : commands.setNode('transition'),
    } as any
  },

  addInputRules() {
    return [transitionInputRule(this.type)]
  },
})
