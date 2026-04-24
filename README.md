# SYNOP

한국 시나리오 작가를 위한 웹 기반 전문 집필 도구.

AI 보조 없이 작가 본인의 글에 집중할 수 있는 환경을 제공한다. 로그인한 사용자만 접근할 수 있으며, 모든 데이터는 Supabase(PostgreSQL)에 실시간 저장된다.

---

## 목차

1. [기능 개요](#기능-개요)
2. [시나리오 에디터 상세](#시나리오-에디터-상세)
3. [끄적 모드](#끄적-모드)
4. [등장인물 관리](#등장인물-관리)
5. [공유 및 내보내기](#공유-및-내보내기)
6. [기술 스택](#기술-스택)
7. [아키텍처](#아키텍처)
8. [시작하기](#시작하기)
9. [DB 스키마](#db-스키마)
10. [파일 구조](#파일-구조)
11. [에디터 확장 목록](#에디터-확장-목록)
12. [개발 원칙](#개발-원칙)

---

## 기능 개요

SYNOP은 두 가지 집필 모드를 제공한다.

| 모드 | 경로 | 설명 |
|------|------|------|
| **집필** | `/write` | 프로젝트(작품) 단위 관리. 기획의도·등장인물·시놉시스·시나리오 4종 문서 작성 |
| **끄적** | `/jot` | 프로젝트 구조 없이 자유롭게 쓰는 메모장. 공유 가능 |

---

## 시나리오 에디터 상세

`/write/[id]/scenario`에서 열리는 전용 에디터. ProseMirror 기반 Tiptap v3 위에 한국 시나리오 포맷 전용 노드 확장을 직접 구현했다.

### 서식 노드와 트리거

| 노드 | 트리거 | Enter 동작 | Backspace(비어있을 때) | 시각 스타일 |
|------|--------|-----------|----------------------|-------------|
| **씬 제목** (sceneHeading) | `# ` + Space | 일반 단락으로 | 씬 삭제 확인 후 제거 | 대문자, 굵게, 하단 구분선, `S#N.` 자동 넘버링 |
| **지문** (stageDirection) | `(` 입력 | 일반 단락으로 | 일반 단락으로 | 가운데 정렬, 짙은 회색, `( )` 자동 래핑 |
| **대사 화자** (characterCue) | 툴바 버튼 또는 `[` | 대사(dialogue) 노드 생성 | 일반 단락으로 | 짙은 회색, 굵게 |
| **대사** (dialogue) | characterCue Enter | 일반 단락으로 | 일반 단락으로 | 좌측 들여쓰기 |
| **인물+대사 인라인** (speechLine) | `[` 입력 후 이름 → Enter | 줄바꿈(hardBreak, 대사 열 유지) | 일반 단락으로 | 인물명(7em 고정 너비) + 대사 인라인 |

#### speechLine 상세

`[`를 입력하면 `characterInput` 노드로 진입한다. 이름 입력 중에는:

- **Tab / →** — 자동완성(ghost text) 수락
- **Enter** — 이름 확정 후 `speechLine` 노드 생성, 커서가 대사 영역으로 이동
- **Backspace** (비어있을 때) / **Esc** — 일반 단락으로 복귀

`speechLine`에서:

- **Enter** — `hardBreak` 삽입 (대사 열 기준으로 줄바꿈)
- **Ctrl+Enter** — 대사 종료, 다음 줄에 일반 단락 생성
- **인물명 클릭** — 인라인 편집 모드 진입 (Enter/blur 시 속성 업데이트, Esc 시 복원)

#### 등록된 인물 자동완성

`getCharacterNames(projectId)`로 등록된 인물 목록을 가져와 `charactersRef`에 보관한다. `[` 입력 후 이름을 타이핑하면 ghost text로 자동완성 후보가 표시된다. 한국어(IME) 입력 중 Enter 처리는 `handleDOMEvents.keydown`으로 별도 처리한다.

### 부가 기능

| 기능 | 설명 |
|------|------|
| **자동저장** | 입력 후 500ms 디바운스로 Supabase 저장. 저장 상태 표시(녹색 점·빨간 점) |
| **오프라인 감지** | `window.offline/online` 이벤트로 네트워크 상태 감지. 오프라인 시 경고 팝업 |
| **목차(TOC)** | sceneHeading 기반 실시간 씬 목록. 클릭 시 해당 씬으로 스크롤. xl 화면에서 우측 패널로 표시 |
| **씬 카운터** | CSS `counter-reset / counter-increment`로 `S#N.` 자동 넘버링 |
| **툴바 자동 숨김** | 스크롤 다운 시 툴바 숨김, 스크롤 업 시 복원 (grid-template-rows 트랜지션) |
| **폰트 선택** | 나눔고딕 / 물마루 / 코퍼브바탕 / 이야기 중 선택. localStorage에 저장 |
| **하단 통계바** | 씬 수·글자 수 실시간 표시, 저장 상태 인디케이터 |

### 버전 히스토리

에디터에서 수동 저장 시점에 `document_versions` 테이블에 스냅샷을 저장한다. 7일이 지난 버전은 자동 삭제된다. 버전 패널에서 목록을 열람하고 원하는 시점으로 복원할 수 있다.

---

## 끄적 모드

`/jot` — 구조 없이 자유롭게 쓰는 공간. `FreeEditor`를 사용하며 StarterKit 기반 리치 텍스트를 지원한다(제목·목록·볼드·코드블록 등). 작성된 글은 `jottings` 테이블에 저장되고 버전 히스토리도 동일하게 관리된다.

---

## 등장인물 관리

`/write/[id]/characters` — 프로젝트별 인물 카드 등록.

| 필드 | 설명 |
|------|------|
| 이름 | 필수. 시나리오 에디터 자동완성에 활용 |
| 성별 | 선택 |
| 나이 | 선택 |
| 직업 | 선택 |
| 성격 요약 | 선택 |
| 상세 설명 | 자유 서술 |

인물 관계도는 `DiagramCanvas`에서 드래그로 노드를 배치하고 엣지로 연결한다. 관계 레이블을 직접 입력할 수 있으며, 레이아웃은 `diagrams` 테이블에 저장된다.

---

## 공유 및 내보내기

### 공유 링크

`ShareButton`에서 읽기 전용 공개 URL을 생성한다. `share_links` 테이블에 UUID 토큰으로 저장되며 유효기간을 설정할 수 있다. 공유된 URL은 `/share/[token]`에서 접근하며 인증 없이 열람 가능하다.

공유 뷰어(`ScenarioView`)는 시나리오의 모든 노드 타입(sceneHeading, characterCue, dialogue, stageDirection, speechLine 포함)을 정적 HTML로 렌더링한다.

### 내보내기

| 형식 | 동작 |
|------|------|
| **.md** | `exportMarkdown()` — Tiptap JSON을 Markdown 문자열로 변환 후 파일 다운로드 |
| **.pdf** | `exportPDF()` — `window.print()` 호출. `@media print` CSS로 툴바·목차 숨김, 시나리오 전체 출력 |

---

## 기술 스택

| 역할 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router, TypeScript) | 16.2.4 |
| 에디터 | Tiptap (ProseMirror 기반) | 3.22.4 |
| 스타일 | Tailwind CSS | v4 |
| 인증 / DB | Supabase (Auth + PostgreSQL) | `@supabase/ssr ^0.10` |
| UI 상태 | React | 19.2.4 |
| 배포 | Vercel | — |
| 폰트 | 물마루, 코퍼브바탕, 이야기GGC (self-hosted woff2) + 나눔고딕 (Google Fonts) | — |

---

## 아키텍처

```
브라우저
  └─ Next.js App Router
       ├─ Server Components  — 데이터 페칭 (Supabase 서버 클라이언트)
       ├─ Client Components  — 에디터, 인터랙션
       └─ Server Actions     — 인증 (로그인/로그아웃)

Supabase
  ├─ Auth          — 이메일/비밀번호 인증, 세션 쿠키(@supabase/ssr)
  └─ PostgreSQL    — 모든 데이터 저장

Vercel
  ├─ Edge Network  — 정적 에셋, 폰트 파일(/public/fonts) CDN
  └─ Serverless    — SSR, API Routes
```

### 데이터 흐름

- **읽기**: Server Component에서 `createClient()`(서버용)로 Supabase 직접 쿼리 → props로 Client Component에 전달
- **쓰기**: Client Component에서 `createClient()`(브라우저용)로 직접 호출 (`lib/` 함수 경유)
- **인증**: `middleware.ts` + `@supabase/ssr`로 쿠키 기반 세션 관리. 미인증 접근 시 `/login`으로 리다이렉트

### 에디터 상태 관리

- Tiptap 에디터 인스턴스는 `ScenarioEditor` / `FreeEditor` 내부에서 `useEditor()`로 생성
- 씬 목록·글자 수는 `editor.on('update')` 콜백에서 추출, React state로 관리
- 자동저장은 `debounce(500ms)` + `updateDocument(id, content)` 호출
- 인물 자동완성 데이터는 `useRef`에 보관 (리렌더 없이 확장에서 직접 접근)

---

## 시작하기

### 사전 준비

- Node.js 20+
- Supabase 프로젝트 (무료 플랜으로 시작 가능)

### 설치

```bash
git clone https://github.com/ksthink/synop.git
cd synop
npm install
```

### 환경 변수

`.env.local` 파일을 생성하고 아래 두 값을 채운다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Supabase 대시보드 → Project Settings → API에서 확인할 수 있다.

### DB 마이그레이션

Supabase 대시보드 → SQL Editor에서 `supabase/migrations/001_initial.sql`을 실행한다.

### 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000`에서 확인.

### 프로덕션 빌드

```bash
npm run build
npm run start
```

### Vercel 배포

```bash
vercel --prod
```

Vercel 대시보드 → Project → Settings → Environment Variables에서 위 두 환경 변수를 동일하게 추가한다.

---

## DB 스키마

```sql
-- 프로젝트 (작품)
projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL,
  title       text NOT NULL,
  author      text,
  started_at  date,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
)

-- 문서 (기획의도 / 시놉시스 / 시나리오)
documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES projects ON DELETE CASCADE NOT NULL,
  type        text CHECK (type IN ('intention','synopsis','scenario')) NOT NULL,
  content     text DEFAULT '',              -- Tiptap JSON 직렬화
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (project_id, type)
)

-- 문서 버전 히스토리 (최대 7일 보관)
document_versions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents ON DELETE CASCADE NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now()
)

-- 등장인물
characters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES projects ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  gender      text,
  age         text,
  job         text,
  summary     text,
  description text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
)

-- 인물 관계도
diagrams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES projects ON DELETE CASCADE NOT NULL UNIQUE,
  nodes       jsonb DEFAULT '[]',
  edges       jsonb DEFAULT '[]',
  updated_at  timestamptz DEFAULT now()
)

-- 끄적 메모
jottings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL,
  title       text DEFAULT '',
  content     text DEFAULT '',              -- Tiptap JSON 직렬화
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
)

-- 끄적 버전 히스토리 (최대 7일 보관)
jotting_versions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jotting_id  uuid REFERENCES jottings ON DELETE CASCADE NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now()
)

-- 공유 링크
share_links (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text CHECK (content_type IN ('document','jotting')) NOT NULL,
  content_id   uuid NOT NULL,
  token        text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at   timestamptz NOT NULL,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
)
```

모든 테이블에 Row Level Security(RLS)가 활성화되어 있으며, 사용자는 자신의 데이터에만 접근할 수 있다. `share_links`는 `is_active = true`이고 만료되지 않은 경우 공개 읽기를 허용한다.

---

## 파일 구조

```
synop/
├── app/
│   ├── (app)/                        # 인증된 사용자 전용 레이아웃
│   │   ├── layout.tsx                # 세션 체크, 미인증 시 /login 리다이렉트
│   │   ├── page.tsx                  # 홈 — 집필 / 끄적 모드 선택
│   │   ├── write/
│   │   │   ├── page.tsx              # 집필 홈 (최근 프로젝트, 새 프로젝트)
│   │   │   ├── new/page.tsx          # 프로젝트 생성 폼
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx          # 전체 작품 목록 (서버 컴포넌트, stats 포함)
│   │   │   │   └── ProjectList.tsx   # 목록 UI (클라이언트, 삭제 포함)
│   │   │   └── [id]/
│   │   │       ├── layout.tsx        # 프로젝트 공통 레이아웃
│   │   │       ├── page.tsx          # 프로젝트 대시보드
│   │   │       ├── ProjectHeader.tsx # 프로젝트 제목/작가 표시
│   │   │       ├── DocumentEditor.tsx# 기획의도·시놉시스 공용 에디터 래퍼
│   │   │       ├── intention/        # 기획의도 페이지
│   │   │       ├── synopsis/         # 시놉시스 페이지
│   │   │       ├── characters/       # 등장인물 + 관계도
│   │   │       └── scenario/
│   │   │           ├── page.tsx      # 시나리오 페이지 (서버, 문서 로드)
│   │   │           └── ScenarioPageClient.tsx
│   │   └── jot/
│   │       ├── page.tsx              # 끄적 목록
│   │       ├── new/page.tsx          # 새 끄적
│   │       └── [id]/
│   │           ├── page.tsx
│   │           └── JotEditorClient.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── share/[token]/page.tsx        # 공유 읽기 전용 뷰 (인증 불필요)
│   ├── api/dictionary/route.ts       # 국어사전 API 프록시
│   ├── actions/auth.ts               # 로그인/로그아웃 Server Action
│   ├── layout.tsx                    # 루트 레이아웃 (폰트, 메타데이터)
│   └── globals.css                   # Tailwind + 에디터 전용 CSS
│
├── components/
│   ├── editor/
│   │   ├── ScenarioEditor.tsx        # 시나리오 전용 에디터 (자동저장, TOC, 툴바)
│   │   ├── FreeEditor.tsx            # 자유 에디터 (끄적/기획의도/시놉시스)
│   │   ├── Editor.tsx                # 에디터 기반 컴포넌트
│   │   ├── Toolbar.tsx               # 서식 툴바
│   │   ├── FontSelector.tsx          # 폰트 선택 드롭다운
│   │   ├── DictionaryPanel.tsx       # 국어사전 패널
│   │   ├── VersionPanel.tsx          # 버전 히스토리 패널
│   │   ├── AssetPanel.tsx            # 자산 패널
│   │   ├── Toc.tsx                   # 씬 기반 목차
│   │   └── extensions/
│   │       ├── SceneHeading.ts       # 씬 제목 노드 (# 트리거, S#N 넘버링)
│   │       ├── StageDirection.ts     # 지문 노드 (( 트리거, 가운데 정렬)
│   │       ├── CharacterCue.ts       # 대사 화자 노드
│   │       ├── Dialogue.ts           # 대사 노드
│   │       ├── CharacterInput.ts     # 인물명 입력 노드 ([ 트리거, 자동완성, IME 처리)
│   │       ├── SpeechLine.ts         # 인물+대사 인라인 노드 (NodeView, 이름 클릭 편집)
│   │       ├── Character.ts          # 인물 마크
│   │       ├── Slugline.ts           # 슬러그라인
│   │       ├── Transition.ts         # 장면 전환
│   │       └── Effect.ts             # 효과
│   ├── characters/
│   │   ├── CharacterList.tsx
│   │   ├── CharacterCard.tsx
│   │   └── CharacterForm.tsx
│   ├── diagram/
│   │   ├── DiagramCanvas.tsx         # 드래그 가능 관계도 캔버스
│   │   ├── DiagramNode.tsx
│   │   ├── DiagramEdge.tsx
│   │   └── RelationLabel.tsx
│   ├── share/
│   │   └── ShareButton.tsx           # 공유 링크 생성/복사 드롭다운
│   ├── ThemeProvider.tsx             # 다크모드 (class 토글)
│   └── ThemeToggle.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # 브라우저용 Supabase 클라이언트
│   │   └── server.ts                 # 서버용 Supabase 클라이언트 (쿠키 기반)
│   ├── projects.ts                   # 프로젝트 CRUD
│   ├── documents.ts                  # 문서 CRUD + getScenarioDocs (배치)
│   ├── characters.ts                 # 인물 CRUD + getCharacterNames
│   ├── diagram.ts                    # 관계도 저장·조회
│   ├── jottings.ts                   # 끄적 CRUD
│   ├── versions.ts                   # 버전 히스토리 저장·복원 (7일 자동 정리)
│   ├── share.ts                      # 공유 링크 생성·조회·비활성화
│   ├── export.ts                     # exportMarkdown / exportPDF
│   ├── storage.ts                    # 로컬 임시 저장 (localStorage)
│   └── typewriterSound.ts            # 타이핑 효과음 (Web Audio API)
│
├── hooks/
│   └── useEditorFont.ts              # 에디터 폰트 선택 훅 (localStorage 유지)
│
├── public/
│   ├── fonts/
│   │   ├── Mulmaru.woff2
│   │   ├── IyagiGGC.woff2
│   │   └── KoPubBatang.woff2
│   └── (아이콘, 효과음 등)
│
└── supabase/
    ├── migrations/001_initial.sql
    └── schema.sql
```

---

## 에디터 확장 목록

### 시나리오 전용 확장 (ScenarioEditor)

| 확장 | 파일 | 역할 |
|------|------|------|
| SceneHeading | `extensions/SceneHeading.ts` | `# ` 트리거로 씬 제목 블록 생성. CSS counter로 S#N 자동 넘버링. 빈 상태 Backspace 시 삭제 확인 |
| StageDirection | `extensions/StageDirection.ts` | `(` 트리거로 지문 블록 생성. CSS `::before/::after`로 괄호 표시. 가운데 정렬 |
| CharacterCue | `extensions/CharacterCue.ts` | 대사 화자 블록. Enter 시 Dialogue 노드 생성 |
| Dialogue | `extensions/Dialogue.ts` | 대사 블록. Enter 시 일반 단락으로 |
| CharacterInput | `extensions/CharacterInput.ts` | `[` 트리거로 인물명 입력 모드. ghost text 자동완성, IME Enter 처리, Enter 시 SpeechLine 변환 |
| SpeechLine | `extensions/SpeechLine.ts` | 인물명(attr) + 대사(content) 인라인 레이아웃. NodeView로 렌더링. 이름 클릭 시 contentEditable 편집 |

### StarterKit에서 비활성화된 항목

heading, bulletList, orderedList, listItem, code, codeBlock, horizontalRule, strike, italic, blockquote

(시나리오 전용 포맷 유지를 위해 일반 리치텍스트 기능 제거)

### 자유 에디터 추가 확장 (FreeEditor)

StarterKit 기본값에 Placeholder, CharacterCount 추가.

---

## 개발 원칙

- **Supabase 쿼리는 `lib/`에서만** — 컴포넌트에서 Supabase를 직접 호출하지 않는다.
- **타입 명시** — `any` 사용 금지. DB 행은 `Row` 인터페이스로 변환 후 사용.
- **서버/클라이언트 Supabase 분리** — 서버 컴포넌트와 서버 액션은 `lib/supabase/server.ts`, 클라이언트 컴포넌트는 `lib/supabase/client.ts`.
- **N+1 방지** — 목록 페이지에서 문서 통계 조회 시 `IN` 쿼리로 단일 요청 처리 (`getScenarioDocs`).
- **단일 책임** — 컴포넌트는 하나의 역할만 담당.
- **빈 상태 / 에러 상태** — 모든 목록 페이지에 포함.
- **다크모드 우선** — `dark:` 클래스를 모든 색상에 병기.
- **폰트 최적화** — CDN 의존 제거, `public/fonts/*.woff2` + CSS `@font-face` + `font-display: swap`.
