import { Node, mergeAttributes, textblockTypeInputRule, CommandProps } from '@tiptap/core'

export const StageDirection = Node.create({
  name: 'stageDirection',

  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {}
  },

  parseHTML() {
    return [{ tag: 'p[data-type="stage-direction"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { 'data-type': 'stage-direction', class: 'stage-direction' }), 0]
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-d': () => (this.editor.commands as any).toggleStageDirection(),
    }
  },

  addCommands() {
    return {
      toggleStageDirection:
        () =>
        ({ commands, state }: CommandProps) => {
          const { $from } = state.selection
          const node = $from.parent

          if (node.type.name === 'stageDirection') {
            return commands.setNode('paragraph')
          }
          return commands.setNode('stageDirection')
        },
    } as any
  },

  addInputRules() {
    // Auto-convert when line matches (text) pattern and user presses Enter
    return [
      textblockTypeInputRule({
        find: /^\((.+)\)\s$/,
        type: this.type,
      }),
    ]
  },
})
