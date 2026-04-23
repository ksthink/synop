import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import { NodeType } from '@tiptap/pm/model'

function characterInputRule(type: NodeType) {
  return new InputRule({
    find: /^\[([^\]]+)\]\s$/,
    handler({ state, range, match }) {
      const name = match[1]
      const { tr } = state
      const $pos = state.doc.resolve(range.from)
      const node = type.create(null, state.schema.text(name))
      tr.replaceWith($pos.before(), $pos.after(), node)
    },
  })
}

export const Character = Node.create({
  name: 'character',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'p[data-type="character"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { 'data-type': 'character', class: 'character' }), 0]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { $from } = this.editor.state.selection
        if ($from.parent.type.name !== 'character') return false
        const end = $from.after()
        return this.editor
          .chain()
          .insertContentAt(end, { type: 'dialogue' })
          .setTextSelection(end + 1)
          .run()
      },
    }
  },

  addCommands() {
    return {
      toggleCharacter:
        () =>
        ({ commands, state }: any) =>
          state.selection.$from.parent.type.name === 'character'
            ? commands.setNode('paragraph')
            : commands.setNode('character'),
    } as any
  },

  addInputRules() {
    return [characterInputRule(this.type)]
  },
})
