# 1. Target과 완료 기준

**Target**

- `https://github.com/shpeterpan/shpeterpan.github.io.git`의 `main` 브랜치에서 빌드 도구 없이 동작하는 정적 프로페셔널 웹사이트를 완성하고 `https://shpeterpan.github.io`에 배포한다.
- 데스크톱·태블릿·모바일 반응형 레이아웃, 상단 `Games` 메뉴, 키보드·터치 지렁이 게임, 기본 게임과 분리된 `뱀서 모드`를 제공한다.
- 현재 작업 폴더는 대상 저장소의 clone이 아니고 사이트 소스와 `CV.pdf`가 없으므로, 저장소 확보와 콘텐츠 승인을 구현보다 먼저 수행한다.

**완료 기준**

- 승인된 프로필 자료만 사용하며 확인되지 않은 정보는 공개 페이지에 넣지 않는다.
- 정적 HTML/CSS/JavaScript와 상대 경로만으로 GitHub Pages에서 동작한다.
- 375px, 768px, 1440px에서 가로 스크롤, 콘텐츠 겹침, 잘린 핵심 UI 없이 내비게이션과 게임을 사용할 수 있다.
- 시맨틱 랜드마크, 키보드 포커스, 충분한 대비, `prefers-reduced-motion` 대응을 갖춘다.
- 지렁이 게임은 시작·이동·먹이·성장·점수·충돌·일시정지·종료·재시작이 동작하고 방향키/WASD와 승인된 터치 방식으로 조작할 수 있다.
- `뱀서 모드`는 이동, 자동 공격, 적 웨이브, 경험치, 레벨업 선택, 5분 생존, 보스 1종, 자동 무기 3종과 진화, 제한된 영구 강화 및 저장 초기화를 제공하고 기본 모드와 상태가 분리된다.
- HTML, CSS, JavaScript, 콘텐츠, 반응형, 접근성, 게임, Pages 호환성에 대한 Claude Code CLI Sonnet의 전체 검증이 통과하고 비밀정보 노출, 깨진 내부 링크, 콘솔 오류가 0건이다.
- 전체 검증 후 사람이 diff와 배포 대상을 승인하며, 승인된 commit이 공개 URL에서 정상 동작한다.

초기 상태는 `READY`이다. 정상 전이는 `READY → ACTING → VERIFYING → PASSED → DEPLOY_APPROVAL_REQUIRED → DEPLOYED`이다. 검증 실패 시 `VERIFYING → RETRYING → ACTING`, 진행 불가 시 `BLOCKED`, 사람 판단이 필요하면 `HITL_REQUIRED`로 전이한다.

## 이번 단계 실행 순서

1. `MEMORY.md`, `CHANGE_REQUEST.md`, `AORR.md`, 현재 코드, 마지막 정상 배포 상태를 기준선으로 확인한다.
2. Change Item을 의존성 순서대로 최소 수정한다.
3. 변경 후 검증은 허용된 verifier 경로로만 수행하고, 승인 전 commit/push/deploy는 하지 않는다.

# 2. Act: Codex가 수행할 최소 수정

1. `READY`에서 승인된 입력과 직전 Claude 검증 결과를 확인하고, 대상 저장소와 수정 범위를 특정한 뒤 `ACTING`으로 전이한다.
2. 최초 루프에서는 공개 원격 저장소를 별도 디렉터리에 clone하여 보존할 파일과 Pages 구성을 읽는다. 공개 접근이 되면 토큰을 사용하지 않는다.
3. 각 Act는 해당 루프의 통과 기준을 만족하는 가장 작은 단위로 제한한다. 기존 콘텐츠를 보존하고 정적 HTML/CSS/JavaScript 경계를 유지한다.
4. 변경 전후 파일 목록과 diff를 기록하되 `github_token.txt`, `env_settings.txt`의 내용은 읽거나 출력하거나 Git에 추가하지 않는다.
5. Retry에서는 Claude가 분류한 원인 하나만 선택하고 그 원인과 직접 관련된 파일만 수정한다. 다른 개선, 리팩터링, 포맷 변경은 섞지 않는다.
6. 수정이 끝나면 변경 파일, 해결하려는 실패 ID, 예상 효과를 Claude에 전달하고 `VERIFYING`으로 전이한다.
7. 프로필 사실, 기존 비공개 콘텐츠, 디자인 우선순위, 터치 방식처럼 승인 없이 결정할 수 없는 항목은 수정하지 않고 `[사람 확인 필요]`로 표시하여 `HITL_REQUIRED`로 전이한다.

# 3. Observe: Claude가 실행할 테스트와 수집할 결과

Claude Code CLI Sonnet은 Codex가 전달한 대상 저장소에서 Verifier로 동작하며, 수정 파일만 보는 검증이 아니라 아래 전체 회귀 검증을 매번 동일한 조건으로 실행한다.

- **저장소·보안:** 현재 브랜치/commit, 변경 파일, 비밀 파일의 추적 여부, 토큰·키 패턴, GitHub Pages 대상 경로를 확인한다.
- **정적 구조:** HTML 파싱/검증, 필수 landmark·viewport·Games 링크, CSS/JavaScript 로드, 상대 자산 경로, 내부 링크와 파일 존재 여부를 확인한다.
- **JavaScript:** 문법 오류, 초기화 오류, 콘솔 error/unhandled rejection, 이벤트 리스너 중복, 페이지 기능 회귀를 확인한다.
- **반응형·접근성:** 375×812, 768×1024, 1440×900에서 스크린샷과 overflow를 확인하고, 키보드 Tab/Enter/Escape, 포커스 표시, 메뉴 상태, 대비, 축소 모션을 점검한다.
- **기본 게임:** 고정된 입력 시나리오로 시작, 이동, 180도 반전 방지, 먹이, 성장, 점수, 벽/자기 충돌, 일시정지, 종료, 재시작, 화면 크기 변경을 검증한다.
- **입력:** 방향키/WASD와 터치 버튼 또는 승인된 제스처를 검증하고, 게임 입력이 폼·내비게이션·페이지 스크롤을 불필요하게 방해하지 않는지 확인한다.
- **뱀서 모드:** 모드 상태 분리, 자동 공격, 적/투사체/드롭 생성과 정리, 경험치·레벨업, 무기/강화 상한, 진화 조건, 타이머, 보스, 승패, 객체 수 상한, `localStorage` 손상·차단·초기화를 검증한다.
- **콘텐츠:** 승인 자료와 화면 문구를 대조하여 허위 정보, 미확정 placeholder, 개인정보 과다 노출, 깨진 외부 링크를 확인한다.
- **Pages 후보:** 루트 경로 의존성, 정적 서버의 직접 로드, 404 자산, favicon/메타데이터, 공개 URL 배포 전 스모크 시나리오를 확인한다.

Claude는 실행 명령, 도구/브라우저 버전, 종료 코드, 테스트별 PASS/FAIL, 콘솔 로그, 실패한 viewport의 스크린샷, 재현 절차, 기대값/실제값, 관련 파일·줄, 실패 fingerprint를 수집한다. 결과에는 `VERIFIER=CLAUDE_SONNET`과 최종 `PASS` 또는 `FAIL`을 기록한다. Claude CLI가 설치·인증·실행 불가할 때만 Codex가 동일 검증을 실행하고 `VERIFIER=CODEX_FALLBACK`, 불가 사유, 대체 명령, 결과를 기록한다. fallback 자체를 성공으로 간주하지 않으며 동일 전체 검증의 통과 여부로 판정한다.

# 4. Reason: 실패 원인 분류

Claude의 각 실패는 재현 가능한 증거와 함께 아래 하나의 주원인으로만 분류한다. 복수 현상이 있으면 독립 실패 ID로 나누고 선행 원인부터 처리한다.

| 분류 | 판정 기준 |
|---|---|
| `HTML` | 잘못된 마크업, landmark/메타 누락, 깨진 링크·자산 경로, 문서 구조 오류 |
| `CSS` | overflow, 겹침, breakpoint, 대비, 포커스, 모션, 터치 영역 등 표현·반응형 오류 |
| `JAVASCRIPT` | 문법/런타임/상태/이벤트/DOM 초기화 오류와 일반 상호작용 회귀 |
| `GAME` | 이동, 충돌, 점수, 입력, 타이밍, 자동 공격, 적, 레벨업, 저장, 밸런스 상태 오류 |
| `CONTENT` | 사실 불일치, 미승인 개인정보, 미확정 문구, 누락 또는 깨진 프로필/프로젝트 내용 |
| `TEST` | 잘못된 assertion, flaky 대기, fixture/selector 오류 등 제품 코드와 무관한 검증 오류 |
| `ENVIRONMENT` | Claude CLI, 브라우저, 런타임, 네트워크, 권한 또는 로컬 서버 실행 환경 문제 |
| `GITHUB` | 원격 저장소, 인증, 브랜치, merge 충돌, Git 추적/비밀 파일 문제 |
| `DEPLOYMENT` | Pages 설정, Actions, 배포 산출물, CDN/공개 URL에서만 발생하는 오류 |
| `UNKNOWN` | 증거가 부족하거나 위 분류로 확정할 수 없는 문제. 추측 수정 없이 추가 관찰 또는 `[사람 확인 필요]` |

분류 결과에는 `failure_id`, 분류, 재현 절차, 기대값/실제값, 관련 파일, 실패 fingerprint, 권장 최소 수정 범위를 포함한다. 제품 결함과 환경 결함이 함께 보이면 제품 코드를 먼저 바꾸지 않고 환경을 분리 재현한다.

# 5. Repeat: Codex 최소 수정 → Claude 동일 테스트 재실행

1. `VERIFYING`에서 하나라도 실패하면 `RETRYING`으로 전이한다.
2. Codex는 가장 선행하는 실패 ID 하나를 선택하고, 해당 원인 하나 및 직접 관련 파일만 수정하여 `ACTING`으로 전이한다.
3. Claude는 이전 실패 재현만 선택 실행해 수정 효과를 빠르게 확인한 뒤, 최초 Observe와 같은 환경·viewport·시나리오로 전체 검증을 다시 실행한다.
4. fingerprint가 사라져도 새 실패나 회귀가 있으면 `PASSED`로 전이하지 않는다. 새 실패를 분류하고 다시 `RETRYING`으로 전이한다.
5. Claude의 전체 검증이 모두 통과한 경우에만 `PASSED`로 전이한다. 부분 통과, 수동 확인 예정, fallback 미실행은 통과가 아니다.
6. 오류별 Retry는 최대 3회다. 같은 fingerprint가 2회 연속 관찰되면 Retry 한도에 남아 있어도 추측 수정을 즉시 중단하고 `BLOCKED` 또는 `HITL_REQUIRED`로 전이한다. 원인 분류가 바뀌면 별도 실패 ID로 기록하고 추가 증거를 먼저 수집한다.
7. `PASSED` 이후 코드가 바뀌면 상태를 `ACTING`으로 되돌리고 Claude 전체 검증을 다시 받아야 한다.

# 6. Stop과 HITL 조건

**Stop**

- Claude 전체 검증이 통과하면 구현 루프를 멈추고 `PASSED → DEPLOY_APPROVAL_REQUIRED`로 전이한다.
- 사람의 명시적 승인 전에는 commit/push/Pages 설정 변경/배포를 하지 않는다.
- 승인 후 배포와 공개 URL 스모크 검증까지 통과해야 `DEPLOYED`로 종료한다.
- 공개 URL 검증 실패는 `DEPLOYMENT` 또는 `GITHUB`으로 분류하여 `RETRYING`으로 돌아가며, 추가 배포 승인이 필요하면 다시 `DEPLOY_APPROVAL_REQUIRED`로 전이한다.

**HITL_REQUIRED**

- `[사람 확인 필요]`: 보존할 기존/비공개 콘텐츠, 프로필·CV와 공개 범위, 언어·표시 이름·직함, MYZ Studio/Ant Design 우선순위, 브랜드/테마, 게임 규칙·터치 방식, Games 배치가 확정되지 않은 경우
- 기존 원격 콘텐츠를 덮어쓸 위험, 대상 저장소/브랜치 불일치, 예상 밖의 사용자 변경 또는 merge 충돌이 있는 경우
- 토큰/비밀 파일이 Git에 추적되거나 과거 commit에서 발견된 경우. 값을 출력하지 않고 즉시 중단한다.
- 인증이 실제로 필요하거나 권한 확대, 저장소 설정 변경, force 작업, 데이터 삭제가 필요한 경우
- 콘텐츠 사실성, 디자인 수용성, 게임 난이도·재미처럼 자동 검증으로 확정할 수 없는 경우
- 전체 검증 통과 후 push·배포 승인과 최종 공개 콘텐츠 승인이 필요한 경우

**BLOCKED**

- 저장소에 접근할 수 없고 안전한 대체 입력이 없거나, 필수 실행 환경을 Claude와 Codex fallback 모두 구성할 수 없거나, 동일 실패가 3회 연속 재현되며 추가 증거를 얻을 수 없는 경우
- `BLOCKED` 보고에는 마지막 성공 상태, 실패 분류, 재현 명령, 수집 증거, 시도한 최소 수정, 해제에 필요한 입력을 포함한다.

# 7. 개발 루프 표

| 루프 | 입력 | Codex Act | Claude Verify | 통과 기준 | 다음 상태 |
|---|---|---|---|---|---|
| L0 요구사항 승인 | `STEP1_ANALYSIS.md`, 사용자 설정, 미확정 목록 | 코드 변경 없이 보존 범위·콘텐츠·디자인·게임 규칙 승인 항목 확정 | 승인값의 누락·충돌과 범위 일관성 확인 | 필수 `[사람 확인 필요]` 항목이 구현 가능한 수준으로 확정 | `READY` 또는 `HITL_REQUIRED` |
| L1 저장소 확보 | 승인 범위, 공개 원격 URL | 대상 저장소를 별도 디렉터리에 clone하고 기존 파일·브랜치·Pages 구조를 인벤토리 | remote/branch/commit, 기존 콘텐츠, 비밀 파일 추적, 작업 트리 확인 | 올바른 대상이며 보존 목록과 안전한 작업 기준선이 확정 | `VERIFYING → PASSED`; 실패 시 `RETRYING`, `GITHUB`, `HITL_REQUIRED` |
| L2 정보 구조 | 승인 프로필/CV, L1 인벤토리 | Home/About/Experience/Projects/Skills/Contact/Games 구조와 콘텐츠 스키마 최소 반영 | 사실 대조, 미확정 문구, 내비게이션·섹션 연결 확인 | 승인된 사실만 포함하고 필수 섹션·Games 진입점 존재 | `VERIFYING → PASSED` 또는 `RETRYING` |
| L3 정적 셸 | L1~L2, 기존 파일 | 기존 콘텐츠를 보존하며 HTML/CSS/JS 연결, viewport, landmark 구현 | HTML, 경로, 내부 링크, 콘솔, 정적 서버 로드 전체 검증 | 404·HTML 오류·콘솔 오류 없이 정적 셸 동작 | `VERIFYING → PASSED` 또는 `RETRYING` |
| L4 디자인·반응형 | 승인 디자인 방향, L3 | CSS 토큰과 최소 breakpoint로 레이아웃·테마 구현 | 375/768/1440 스크린샷, overflow, 대비, reduced motion | 세 viewport에서 겹침/가로 스크롤 없이 읽고 조작 가능 | `VERIFYING → PASSED` 또는 `RETRYING` |
| L5 콘텐츠 | 승인 프로필·프로젝트 자료 | 승인된 문구·링크·자산만 채움 | 원자료 대조, 개인정보, placeholder, 링크 검증 | 임의 생성 정보와 미승인 공개 정보 0건 | `VERIFYING → PASSED` 또는 `HITL_REQUIRED` |
| L6 내비게이션·접근성 | L3~L5 | 반응형 메뉴, skip link, 포커스·키보드 상태 최소 구현 | Tab/Enter/Escape, focus, landmark, 메뉴 회귀 전체 검증 | 키보드만으로 전 구간 접근 가능하고 상태가 명확 | `VERIFYING → PASSED` 또는 `RETRYING` |
| L7 기본 게임 | 승인 게임 규칙, Games 영역 | 이동·먹이·성장·점수·충돌·상태·재시작을 독립 구현 | 결정적 게임 시나리오, 빠른 입력, resize, 사이트 회귀 | 기본 루프가 일관되고 종료·재시작 가능 | `VERIFYING → PASSED` 또는 `RETRYING` |
| L8 키보드·터치 | L7, 승인 터치 방식 | 방향키/WASD와 터치 입력, 일시정지, 입력 중복 방지 구현 | 키보드·touch, 스크롤 간섭, 180도 반전, 포커스 검증 | 두 입력 방식이 동일 규칙으로 안전하게 동작 | `VERIFYING → PASSED` 또는 `RETRYING` |
| L9 뱀서 코어 | L7~L8, 확정 권장 범위 | 모드 분리, 이동·자동 공격·적·경험치·레벨업·타이머 구현 | 상태 분리, spawn/cleanup, 전투·성장 루프, 프레임 안정성 | 기본 모드 회귀 없이 생존 루프 완결, 객체 상한 준수 | `VERIFYING → PASSED` 또는 `RETRYING` |
| L10 뱀서 확장 | L9 | 5분 런, 보스 1종, 무기 3종·진화, 영구 강화·초기화 추가 | 승패, 진화 조건/상한, 저장 손상·차단, 기본 모드 회귀 | 전투·성장·진화·보스·보상 루프와 안전한 저장 동작 | `VERIFYING → PASSED` 또는 `RETRYING` |
| L11 게임 품질 | L7~L10 | 상태 안내, 접근성, 작은 화면, 저장 실패 처리를 최소 보완 | 상태 전달, 대비, touch target, reduced motion, 저장 실패 | 시각 외 상태 이해 가능, 저장 실패가 플레이를 막지 않음 | `VERIFYING → PASSED` 또는 `RETRYING` |
| L12 통합 회귀 | 완성 후보 | Claude 실패 하나씩 관련 파일만 최소 수정 | 보안·HTML·CSS·JS·콘텐츠·반응형·접근성·게임·Pages 전체 검증 | Claude 전체 검증 PASS; fallback이면 `CODEX_FALLBACK`과 동일 범위 PASS | `PASSED → DEPLOY_APPROVAL_REQUIRED`; 실패 시 `RETRYING` |
| L13 배포 | 통과 commit 후보, 사람 승인 | 승인된 변경만 commit/push하고 승인된 Pages 설정 반영 | remote commit, Actions/Pages 상태, 공개 URL 핵심 경로·게임 스모크 | 승인 commit과 공개 배포가 일치하고 공개 URL 정상 | `DEPLOYED`; 실패 시 `RETRYING`, 승인 없으면 `DEPLOY_APPROVAL_REQUIRED` |

# 8. Self-Correcting TDD Loop

## 8.1 실행 모드와 확인된 Verifier

- 기본 모드는 `CODEX_WORKER + CLAUDE_VERIFIER`다. Codex는 코드 분석과 원인 하나에 대한 최소 수정만 담당하고, Claude Code CLI는 변경 전·후 테스트를 담당한다.
- 확인일은 2026-07-16(Asia/Seoul)이다. `claude` 명령은 `/Users/seungheema/.local/bin/claude`에 있고 Claude Code CLI 버전은 `2.1.211`이다.
- `claude auth status`에서 로그인 상태와 first-party 실행 가능 상태를 확인했다. 모델 확인용 최소 호출이 exit code `0`과 `CLI_OK`를 반환했다.
- 실제 사용 가능한 Sonnet 5의 정확한 모델명은 `claude-sonnet-5`다. 모델 확인 응답의 `modelUsage`에도 같은 이름이 기록되었으므로 모든 기본 검증은 `--model claude-sonnet-5`로 실행한다.
- 이 확인은 CLI와 모델 가용성 확인이며 프로젝트 테스트가 아니다. 이 단계에서는 변경 전·후 테스트를 실행하지 않았다.
- Claude가 실행한 명령과 동일한 테스트를 Codex가 중복 실행하지 않는다. Claude CLI가 설치·로그인·호출·모델 선택 문제로 실제 검증을 수행할 수 없을 때만 `CODEX_FALLBACK`을 활성화한다.

## 8.2 Verifier 중심 실행 순서

1. Claude(`claude-sonnet-5`)가 변경 전 전체 기준선 테스트를 실행한다.
2. Claude가 실패별 `failure_id`, 핵심 오류, 관련 파일·라인, 재현 정보와 fingerprint를 보고한다.
3. Codex가 선행 실패 하나를 선택해 그 원인에 필요한 최소 코드와 최소 파일만 수정한다.
4. Claude가 해당 실패를 만든 동일 명령·환경·입력으로 테스트를 재실행한다.
5. 실패하면 Claude가 새 결과와 fingerprint를 보고하고, Codex는 같은 규칙으로 최소 수정 후 재검증을 요청한다.
6. 동일 테스트가 통과하면 Claude가 전체 회귀 테스트를 실행한다. 전체 테스트가 모두 통과한 경우에만 상태를 `PASSED`로 바꾼다.
7. 일부 통과, 미실행 항목, 수동 확인 예정 또는 테스트를 완화해 얻은 결과는 `PASSED`가 아니다.

## 8.3 고정 검증 범위

- 필수 파일 존재 여부, 대소문자를 포함한 상대 경로, 공개 대상에서 비밀 파일 제외
- HTML 파싱·시맨틱 구조·viewport·내부 링크·CSS/JavaScript 및 자산 연결
- 375×812, 768×1024, 1440×900에서 CSS 반응형, overflow, 겹침, 키보드 포커스와 터치 영역
- JavaScript 문법·초기화·콘솔 오류·unhandled rejection·이벤트 중복
- 기본 지렁이 게임의 시작, 이동, 반전 방지, 먹이, 성장, 점수, 충돌, 일시정지, 종료, 재시작
- 방향키/WASD와 승인된 터치 입력, 페이지 스크롤·내비게이션과의 입력 충돌
- 뱀서 모드의 상태 분리, 이동, 자동 공격, 적 웨이브, 경험치, 레벨업, 무기·진화, 타이머, 보스, 저장과 초기화
- 로컬 정적 HTTP 서버의 핵심 URL 응답, 자산 404, 직접 로드와 콘솔 상태
- 빌드 도구 없는 정적 호스팅, 상대 URL, 대소문자 경로 등 GitHub Pages 호환성

## 8.4 실패 보고 형식

Claude와 fallback Verifier는 실패 및 최종 결과를 아래 필드로 남긴다. 명령에 비밀값을 직접 넣지 않으며 토큰과 인증값은 기록하지 않는다.

```text
timestamp: <ISO-8601>
failure_id: <category-sequence 또는 NONE>
executor: CLAUDE_VERIFIER | CODEX_FALLBACK
model: claude-sonnet-5 | <Codex 실제 모델명>
mode: BASELINE | SAME_TEST | FULL_REGRESSION
command: <실행 명령>
exit_code: <정수>
core_error: <핵심 오류 또는 NONE>
related_locations: <상대 파일:라인 목록 또는 NONE>
fingerprint: <정규화된 오류 유형+명령+최상위 관련 위치의 해시/문자열 또는 NONE>
retry: <해당 오류 0..3>
fallback_used: true | false
fallback_reason: <사유 또는 NONE>
final_status: PASS | FAIL | BLOCKED | HITL_REQUIRED
```

fingerprint는 타임스탬프, 임시 포트, 절대 작업 경로처럼 매 실행마다 변하는 값을 제거하고 `실패 assertion/오류 유형 + 테스트 명령 + 최초 관련 상대 파일·라인`으로 만든다. 같은 원인을 동일하게 판정할 수 있어야 하며, 오류가 달라지면 새 `failure_id`와 fingerprint를 부여한다.

## 8.5 Retry와 교정 제한

- 오류 하나당 Retry는 최대 3회다. 최초 기준선 실패는 Retry 0이며, 각 최소 수정 뒤 재검증을 Retry 1~3으로 센다.
- 같은 fingerprint가 연속 2회 나오면 남은 Retry와 관계없이 중지하고 `BLOCKED` 또는 사람 판단이 필요한 경우 `HITL_REQUIRED`로 전이한다.
- 한 Retry에서는 원인 하나와 직접 관련된 최소 파일만 수정한다. 리팩터링, 무관한 정리, 여러 실패의 묶음 수정은 다음 루프로 분리한다.
- 테스트 삭제, skip, assertion 완화, 임계값 확대, 검증 범위 축소, 제품 기능 제거로 통과시키는 행위를 금지한다.
- Claude가 변경 전·후 검증을 수행했으면 Codex는 그 테스트를 다시 실행하지 않고 결과와 fingerprint를 다음 Act의 입력으로 사용한다.

## 8.6 CODEX_FALLBACK

- 다음 중 하나로 Claude가 실제 프로젝트 검증을 수행할 수 없을 때만 fallback을 사용한다: 명령 없음, 인증 불가, 허용 Sonnet 모델 호출 불가, CLI 실행 실패, 필수 도구 실행 권한/환경 문제.
- 일시적인 제품 테스트 실패, Claude가 보고한 코드 결함, 결과가 마음에 들지 않는다는 이유로 fallback을 선택하지 않는다.
- fallback에서는 Codex가 Worker와 Verifier를 모두 맡되, 변경 전 테스트 → 실패 기록 → 원인 하나의 최소 수정 → 동일 테스트 → 전체 회귀 순서를 그대로 지킨다.
- 각 기록에 `executor=CODEX_FALLBACK`, Codex의 실제 모델명, `fallback_used=true`, 구체적인 `fallback_reason`을 남긴다. Claude가 다시 사용 가능해지면 다음 검증부터 기본 모드로 복귀한다.
- 현재 상태는 `fallback_used=false`, `fallback_reason=NONE`이다.

## 이번 단계 실행 순서

1. `MEMORY.md`, `AORR.md`, 현재 코드, Git 상태, 배포 흔적, 참고 자료를 확인한다.
2. 요청 원문을 보존한 `CHANGE_REQUEST.md`를 작성한다.
3. 코드 수정, 테스트, commit, push, 배포는 하지 않는다.
