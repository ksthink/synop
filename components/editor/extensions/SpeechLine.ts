import { Node, InputRule } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

function isAtEnd(el: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return false
  const range = sel.getRangeAt(0)
  if (!range.collapsed) return false
  const end = document.createRange()
  end.selectNodeContents(el)
  end.collapse(false)
  return range.compareBoundaryPoints(Range.END_TO_END, end) >= 0
}

export function createSpeechLine(charactersRef: { current: string[] }) {
  return Node.create({
    name: 'speechLine',
    group: 'block',
    content: 'inline*',
    defining: true,

    addAttributes() {
      return { character: { default: '' } }
    },

    parseHTML() {
      return [{ tag: 'div[data-type="speech-line"]' }]
    },

    renderHTML({ node, HTMLAttributes }) {
      return [
        'div',
        { ...HTMLAttributes, 'data-type': 'speech-line', class: 'speech-line', 'data-character': node.attrs.character },
        0,
      ]
    },

    addKeyboardShortcuts() {
      return {
        Enter: () => {
          const { $from } = this.editor.state.selection
          if ($from.parent.type.name !== 'speechLine') return false
          const end = $from.after()
          return this.editor
            .chain()
            .insertContentAt(end, { type: 'paragraph' })
            .setTextSelection(end + 1)
            .run()
        },
        Backspace: () => {
          const { $from } = this.editor.state.selection
          if ($from.parent.type.name !== 'speechLine') return false
          if ($from.parent.textContent !== '') return false
          return this.editor.chain().setNode('paragraph').run()
        },
      }
    },

    addInputRules() {
      return [
        new InputRule({
          find: /^\[\s?$/,
          handler: ({ state, range }) => {
            const { tr } = state
            const $pos = state.doc.resolve(range.from)
            if (!$pos.node(-1).canReplaceWith($pos.index(-1), $pos.indexAfter(-1), this.type)) return null
            tr.setBlockType(range.from, range.to, this.type, { character: '' })
              .deleteRange(range.from, range.to)
          },
        }),
      ]
    },

    addNodeView() {
      return ({ node, editor, getPos }) => {
        const dom = document.createElement('div')
        dom.className = 'speech-line'

        // ── character name area (outside ProseMirror control) ──
        const nameArea = document.createElement('span')
        nameArea.className = 'speech-name-area'
        nameArea.contentEditable = 'false'

        const nameInput = document.createElement('span')
        nameInput.className = 'speech-name-input'
        nameInput.contentEditable = 'true'
        nameInput.spellcheck = false
        nameInput.textContent = node.attrs.character || ''

        const ghostSpan = document.createElement('span')
        ghostSpan.className = 'speech-name-ghost'
        ghostSpan.contentEditable = 'false'

        nameArea.appendChild(nameInput)
        nameArea.appendChild(ghostSpan)

        // ── dialogue contentDOM ──
        const dialogueArea = document.createElement('span')
        dialogueArea.className = 'speech-dialogue-area'

        dom.appendChild(nameArea)
        dom.appendChild(dialogueArea)

        // ── ghost text logic ──
        let ghost = ''

        function updateGhost() {
          const typed = nameInput.textContent || ''
          if (!typed) { ghost = ''; ghostSpan.textContent = ''; return }
          const match = charactersRef.current.find(
            (c) => c.toLowerCase().startsWith(typed.toLowerCase()) && c.length > typed.length
          )
          ghost = match ? match.slice(typed.length) : ''
          ghostSpan.textContent = ghost
        }

        function updateEmptyClass() {
          if (node.content.size === 0) {
            dialogueArea.classList.add('is-empty')
          } else {
            dialogueArea.classList.remove('is-empty')
          }
        }

        function commitName() {
          if (typeof getPos !== 'function') return
          const pos = getPos()
          if (pos == null) return
          const name = nameInput.textContent || ''
          ghost = ''; ghostSpan.textContent = ''
          editor.view.dispatch(
            editor.state.tr.setNodeMarkup(pos, undefined, { character: name })
          )
        }

        function moveCursorToDialogue() {
          if (typeof getPos !== 'function') return
          const pos = getPos()
          if (pos == null) return
          requestAnimationFrame(() => {
            editor.view.focus()
            const sel = TextSelection.create(editor.state.doc, pos + 1)
            editor.view.dispatch(editor.state.tr.setSelection(sel))
          })
        }

        function acceptGhost() {
          if (!ghost) return
          nameInput.textContent = (nameInput.textContent || '') + ghost
          ghost = ''; ghostSpan.textContent = ''
          const s = window.getSelection()
          const r = document.createRange()
          r.selectNodeContents(nameInput); r.collapse(false)
          s?.removeAllRanges(); s?.addRange(r)
        }

        nameInput.addEventListener('input', () => {
          // strip any pasted HTML
          if (nameInput.innerHTML !== nameInput.textContent) {
            const text = nameInput.textContent || ''
            nameInput.textContent = text
            const s = window.getSelection()
            const r = document.createRange()
            r.selectNodeContents(nameInput); r.collapse(false)
            s?.removeAllRanges(); s?.addRange(r)
          }
          updateGhost()
        })

        nameInput.addEventListener('keydown', (e) => {
          e.stopPropagation() // prevent ProseMirror from handling these keys
          if (e.key === 'Tab' || (e.key === 'ArrowRight' && isAtEnd(nameInput))) {
            e.preventDefault()
            acceptGhost()
          } else if (e.key === 'Enter') {
            e.preventDefault()
            acceptGhost()
            commitName()
            moveCursorToDialogue()
          } else if (e.key === 'Backspace' && !nameInput.textContent) {
            e.preventDefault()
            if (typeof getPos !== 'function') return
            const pos = getPos()
            if (pos == null) return
            const n = editor.state.doc.nodeAt(pos)
            if (!n) return
            editor.chain()
              .deleteRange({ from: pos, to: pos + n.nodeSize })
              .insertContentAt(pos, { type: 'paragraph' })
              .setTextSelection(pos + 1)
              .run()
          }
        })

        nameInput.addEventListener('blur', () => {
          const name = nameInput.textContent || ''
          if (name !== node.attrs.character) commitName()
        })

        updateEmptyClass()

        // auto-focus nameInput for newly created speech lines
        if (!node.attrs.character) {
          requestAnimationFrame(() => {
            nameInput.focus()
            const s = window.getSelection()
            const r = document.createRange()
            r.selectNodeContents(nameInput); r.collapse(false)
            s?.removeAllRanges(); s?.addRange(r)
          })
        }

        return {
          dom,
          contentDOM: dialogueArea,
          update(updated) {
            if (updated.type.name !== 'speechLine') return false
            if (document.activeElement !== nameInput) {
              nameInput.textContent = updated.attrs.character || ''
            }
            updateGhost()
            if (updated.content.size === 0) {
              dialogueArea.classList.add('is-empty')
            } else {
              dialogueArea.classList.remove('is-empty')
            }
            return true
          },
        }
      }
    },
  })
}
