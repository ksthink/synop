import { Node, mergeAttributes } from '@tiptap/core'

// 자동완성 상태는 editor.storage에 보관 — React 컴포넌트에서 읽는다
export const CharacterCue = Node.create({
  name: 'characterCue',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'p[data-type="character-cue"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'p',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'character-cue',
        class: 'character-cue',
      }),
      0,
    ]
  },

  addKeyboardShortcuts() {
    return {
      // Enter → Dialogue 생성
      Enter: () => {
        const { $from } = this.editor.state.selection
        if ($from.parent.type.name !== 'characterCue') return false
        const end = $from.after()
        return this.editor
          .chain()
          .insertContentAt(end, { type: 'dialogue' })
          .setTextSelection(end + 1)
          .run()
      },

      // Backspace on empty → paragraph
      Backspace: () => {
        const { $from } = this.editor.state.selection
        if ($from.parent.type.name !== 'characterCue') return false
        if ($from.parent.textContent !== '') return false
        return this.editor.chain().setNode('paragraph').run()
      },

      // Escape → 자동완성 닫기 (React 레이어에서 처리)
      Escape: () => {
        const { $from } = this.editor.state.selection
        if ($from.parent.type.name !== 'characterCue') return false
        return false // propagate
      },
    }
  },

})
