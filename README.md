# Synop

시나리오 작성에 특화된 WYSIWYG 에디터. 범용 마크다운 에디터와 달리 시나리오에 필요한 요소만 제공해 집중력 높은 작업 환경을 만든다.

## 기능

### 서식 요소

| 요소 | 마크다운 트리거 | 단축키 | 스타일 |
|------|----------------|--------|--------|
| 씬 제목 | `## ` | `Cmd+Shift+2` | 대문자, 굵게, 하단 구분선 |
| 인용 | `> ` | `Cmd+Shift+B` | 앞뒤 큰따옴표 |
| 지문 | `(텍스트) ` | `Cmd+Shift+D` | 이탤릭, 회색, 가운데 정렬 |
| 볼드 | `**텍스트**` | `Cmd+B` | 굵게 |

### 모드

- **집필** — 작품 이름과 집필 시점을 입력해 프로젝트를 생성. 자동저장되며 목록에서 다시 열 수 있다.
- **연습** — 프로젝트 저장 없이 자유롭게 작성. 브라우저를 닫아도 내용이 유지된다.
- **목록** — 저장된 작품 목록. 클릭해서 열거나 삭제할 수 있다.

### 기타

- **TOC** — 씬 제목을 기반으로 우측에 실시간 목차 표시. 클릭하면 해당 위치로 스크롤.
- **자동저장** — 입력 후 500ms 디바운스로 localStorage에 자동저장.
- **.md 내보내기** — 툴바에서 Markdown 파일로 다운로드.
- **PDF 내보내기** — 툴바에서 브라우저 인쇄 (툴바·목차 제외).

## 스택

- [Next.js 16](https://nextjs.org/) (App Router, TypeScript)
- [Tiptap v3](https://tiptap.dev/) — ProseMirror 기반 WYSIWYG 에디터
- [Tailwind CSS v4](https://tailwindcss.com/)

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 열기.

## 배포

```bash
vercel --prod
```

## 파일 구조

```
app/
  page.tsx              # 홈 (모드 선택 + 최근 작품)
  practice/page.tsx     # 연습 에디터
  write/page.tsx        # 새 작품 생성 폼
  write/[id]/page.tsx   # 집필 에디터
  projects/page.tsx     # 작품 목록
components/
  editor/
    Editor.tsx          # 에디터 본체
    Toolbar.tsx         # 서식 툴바
    Toc.tsx             # 목차
    extensions/
      StageDirection.ts # 지문 커스텀 노드
  RecentProjects.tsx    # 홈의 최근 작품 목록
lib/
  projects.ts           # 프로젝트 CRUD (localStorage)
  storage.ts            # 연습 모드 자동저장
  export.ts             # .md / PDF 내보내기
```
