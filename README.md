# SYNOP

한국 시나리오 작가를 위한 웹 기반 전문 집필 도구.

AI 보조 없이 작가 본인의 글에 집중할 수 있는 환경을 제공한다. 로그인한 사용자만 접근할 수 있으며, 모든 데이터는 클라우드에 저장된다.

---

## 기능

### 집필 모드

시나리오 전용 WYSIWYG 에디터. 프로젝트(작품)를 생성하고, 아래 네 가지 문서를 각각 작성한다.

| 문서 | 설명 |
|------|------|
| 기획의도 | 작품의 방향과 목적 |
| 등장인물 | 이름, 나이, 직업, 성격 등 캐릭터 프로필 |
| 시놉시스 | 줄거리 요약 |
| 시나리오 | 본편 원고 — 씬 제목·지문·대사 전용 포맷 |

**시나리오 에디터 서식 요소**

| 요소 | 마크다운 트리거 | 단축키 | 스타일 |
|------|----------------|--------|--------|
| 씬 제목 | `## ` | `Cmd+Shift+2` | 대문자, 굵게, 하단 구분선 |
| 지문 | `(텍스트) ` | `Cmd+Shift+D` | 이탤릭, 회색, 가운데 정렬 |
| 인용 | `> ` | `Cmd+Shift+B` | 앞뒤 큰따옴표 |
| 볼드 | `**텍스트**` | `Cmd+B` | 굵게 |

**부가 기능**

- **자동저장** — 입력 후 500ms 디바운스로 Supabase에 저장
- **버전 히스토리** — 최근 7일치 스냅샷 보관, 패널에서 열람·복원
- **목차(TOC)** — 씬 제목 기반 실시간 목차, 클릭 시 해당 씬으로 스크롤
- **공유** — 읽기 전용 공개 URL 생성 (유효기간 설정 가능)
- **.md 내보내기** — Markdown 파일 다운로드
- **PDF 내보내기** — 브라우저 인쇄 (툴바·목차 제외)

### 등장인물 관리

프로젝트별 인물 카드 등록. 이름, 성별, 나이, 직업, 성격 요약, 상세 설명 등을 저장하고, 인물 관계도를 시각적으로 그릴 수 있다.

### 끄적 모드

저장과 형식 없이 자유롭게 쓸 수 있는 공간. 작성한 내용은 목록에서 다시 열거나 공유할 수 있다.

---

## 스택

| 역할 | 기술 |
|------|------|
| 프레임워크 | [Next.js 16](https://nextjs.org/) (App Router, TypeScript) |
| 에디터 | [Tiptap v3](https://tiptap.dev/) (ProseMirror 기반) |
| 스타일 | [Tailwind CSS v4](https://tailwindcss.com/) |
| 인증 / DB | [Supabase](https://supabase.com/) (Auth + PostgreSQL) |
| 배포 | [Vercel](https://vercel.com/) |

---

## 시작하기

### 사전 준비

- Node.js 20+
- Supabase 프로젝트 (무료 플랜으로 충분)

### 설치

```bash
git clone https://github.com/ksthink/synop.git
cd synop
npm install
```

### 환경 변수

`.env.local.example`을 복사해 `.env.local`을 만들고 값을 채운다.

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### DB 마이그레이션

Supabase 대시보드 → SQL Editor에서 `supabase/migrations/001_initial.sql`을 실행한다.

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열기.

---

## 배포

```bash
vercel --prod
```

Vercel 프로젝트 설정에서 환경 변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)를 동일하게 추가한다.

---

## DB 스키마

```
users             id, email, name, created_at
projects          id, user_id, title, author, started_at, created_at, updated_at
documents         id, project_id, type(intention|synopsis|scenario), content, created_at, updated_at
document_versions id, document_id, content, created_at  ← 최대 7일 보관
characters        id, project_id, name, gender, age, job, summary, description, created_at, updated_at
diagrams          id, project_id, nodes(jsonb), edges(jsonb), updated_at
jottings          id, user_id, title, content, created_at, updated_at
jotting_versions  id, jotting_id, content, created_at   ← 최대 7일 보관
share_links       id, content_type(document|jotting), content_id, token, expires_at, is_active, created_at
```

---

## 파일 구조

```
app/
  (auth)/               # 로그인, 회원가입
  (app)/                # 인증 체크 레이아웃
    page.tsx            # 홈 (집필 / 끄적 모드 선택)
    write/              # 집필 — 프로젝트 생성, 목록, 에디터
    jot/                # 끄적 — 자유글 생성, 목록, 에디터
    share/[token]/      # 공유 읽기 전용 뷰
  actions/auth.ts       # 로그인·로그아웃 Server Action

components/
  editor/
    Editor.tsx          # 에디터 본체
    Toolbar.tsx         # 서식 툴바 (스크롤 시 자동 숨김/표시)
    ScenarioEditor.tsx  # 시나리오 전용 에디터
    FreeEditor.tsx      # 끄적용 자유 에디터
    Toc.tsx             # 씬 기반 목차
    VersionPanel.tsx    # 버전 히스토리 패널
    AssetPanel.tsx      # 자산 패널
    DictionaryPanel.tsx # 국어사전 패널
    FontSelector.tsx    # 폰트 선택기
  characters/
    CharacterList.tsx   # 인물 목록
    CharacterCard.tsx   # 인물 카드
    CharacterForm.tsx   # 인물 등록·수정 폼
  diagram/
    DiagramCanvas.tsx   # 관계도 캔버스
    DiagramNode.tsx     # 인물 노드
    DiagramEdge.tsx     # 관계 엣지
    RelationLabel.tsx   # 관계 레이블
  share/
    ShareButton.tsx     # 공유 버튼 + 드롭다운

lib/
  supabase/
    client.ts           # 브라우저용 Supabase 클라이언트
    server.ts           # 서버용 Supabase 클라이언트
  projects.ts           # 프로젝트 CRUD
  documents.ts          # 문서 CRUD
  characters.ts         # 인물 CRUD
  diagram.ts            # 관계도 저장·조회
  jottings.ts           # 끄적 CRUD
  versions.ts           # 버전 히스토리
  share.ts              # 공유 링크 생성·조회
  export.ts             # .md / PDF 내보내기
  storage.ts            # 로컬 임시 저장
  typewriterSound.ts    # 타이핑 효과음

supabase/
  migrations/001_initial.sql
  schema.sql
```

---

## 개발 원칙

- Supabase 쿼리는 `lib/` 디렉토리에서만 작성한다. 컴포넌트에서 직접 호출하지 않는다.
- 타입을 반드시 명시한다. `any` 사용 금지.
- 컴포넌트는 단일 책임 원칙을 따른다.
- 모든 페이지에 빈 상태(empty state)와 에러 상태 UI를 포함한다.
- 화이트 모드 우선, 나눔고딕 기본값.
