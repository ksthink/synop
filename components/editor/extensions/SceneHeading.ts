import { Node, mergeAttributes, InputRule } from '@tiptap/core'

export const SceneHeading = Node.create({
  name: 'sceneHeading',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'h2[data-type="scene-heading"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'h2',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'scene-heading',
        class: 'scene-heading',
      }),
      0,
    ]
  },

  addKeyboardShortcuts() {
    return {
      // Enter → 새 paragraph 생성
      Enter: () => {
        const { $from } = this.editor.state.selection
        if ($from.parent.type.name !== 'sceneHeading') return false
        const end = $from.after()
        return this.editor
          .chain()
          .insertContentAt(end, { type: 'paragraph' })
          .setTextSelection(end + 1)
          .run()
      },

      // Backspace on empty scene heading → confirm delete
      Backspace: () => {
        const { $from } = this.editor.state.selection
        if ($from.parent.type.name !== 'sceneHeading') return false
        if ($from.parent.textContent !== '') return false

        const confirmed = window.confirm(
          '이 씬을 삭제하면 이후 씬 번호가 재정렬됩니다. 계속할까요?'
        )
        if (!confirmed) return true // block default, do nothing
        return this.editor.chain().clearNodes().run()
      },
    }
  },

  addInputRules() {
    return [
      new InputRule({
        find: /^#\s$/,
        handler: ({ state, range }) => {
          const { tr } = state
          const $pos = state.doc.resolve(range.from)
          if (
            !$pos.node(-1).canReplaceWith(
              $pos.index(-1),
              $pos.indexAfter(-1),
              this.type
            )
          )
            return null
          tr.setBlockType(range.from, range.to, this.type).deleteRange(
            range.from,
            range.to
          )
        },
      }),
    ]
  },

})
