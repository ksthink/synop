import { Mark, mergeAttributes, markInputRule } from '@tiptap/core'

export const Effect = Mark.create({
  name: 'effect',

  parseHTML() {
    return [{ tag: 'span[data-type="effect"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'effect', class: 'effect' }), 0]
  },

  addInputRules() {
    return [
      markInputRule({
        find: /\*([^*\s][^*]*)\*$/,
        type: this.type,
      }),
    ]
  },
})
