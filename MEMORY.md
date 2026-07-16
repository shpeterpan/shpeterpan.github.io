# MEMORY.md

## Project Settings
- GitHub Pages 주소: `https://shpeterpan.github.io`
- GitHub 저장소: `https://github.com/shpeterpan/shpeterpan.github.io.git`
- GitHub 토큰 파일명: `github_token.txt`
- 프로필 참고 자료: `CV.pdf` 없음, 승인된 프로필 자료 미확정
- 웹사이트 디자인 참고: `MYZ Studio`, `Ant Design`의 시각 원칙
- 게임 추가 기능: 기본 지렁이 게임과 분리된 `뱀서 모드`(5분 런, 보스 1종, 무기 3종·진화, 제한된 영구 강화/초기화)

## Goal
- 승인된 자료만으로 정적 반응형 프로페셔널 웹사이트와 분리된 게임 구성을 복구·완성하고, 승인 후 배포 가능 상태로 유지한다.

## Scope / Out of Scope
- In: 정적 HTML/CSS/JavaScript, 반응형 UI, Games 진입점, 지렁이 게임, 뱀서 모드, GitHub Pages
- Out: 백엔드, DB, 로그인, 결제, 비승인 외부 API·프레임워크, 미승인 개인정보 생성

## Execution
- Mode: `CODEX_WORKER + CLAUDE_VERIFIER` 확인 완료, 불가 시 `CODEX_FALLBACK`
- Claude model: `claude-sonnet-5`
- CLI check: `claude auth status` OK, `claude --print --model claude-sonnet-5` OK
- Last test: 배포본 HTTP 200, 뱀서 선택 클릭·재개·콘솔 `PASS`

## Current State
- 상태: `ACTING`
- 실행 모드: `CODEX_FALLBACK`
- Claude 모델: `claude-sonnet-5`(문서상 검증 대상, 이 세션에서는 직접 호출 불가)
- 현재 commit: `e010166`
- 마지막 정상 commit·URL: `e010166`, `https://shpeterpan.github.io/`
- Git 상태: `main`, modified `AORR_LOG.md`, `MEMORY.md`, `index.html`, `styles.css`; untracked `.DS_Store`, `AUTOMATION_READINESS.md`, `CHANGE_REQUEST.md`, `STEP1_ANALYSIS.md`, `claude-code-cli/`, `samsung-agent-education2-main/`
- Rollback 기준: 이번 루프에서 손댄 파일만 되돌리고, 기준선은 마지막 정상 배포 커밋 `e010166`로 복구한다.
- 완료 루프: 현재 디자인 재배치와 공개 콘텐츠 정리 진행 중
- 다음 루프: 2026 금융앱형 배치와 공개 문구 정리
- Retry: `1`
- fingerprint: `없음`
- blocker: 없음

## Acceptance
- 승인된 사실만 공개하고, 상대 경로와 정적 호스팅만으로 동작한다.
- 375px, 768px, 1440px에서 가로 스크롤·겹침 없이 읽히고 조작된다.
- 게임 입력, 상태 전환, 저장/초기화, Pages 호환성이 깨지지 않는다.
- 테스트 삭제·완화 없이 전체 검증이 PASS일 때만 다음 단계로 간다.

## Guardrails
- 확인되지 않은 개인정보 생성 금지
- 기존 콘텐츠 임의 삭제 금지
- 테스트 삭제·완화 금지
- 대규모 재작성 금지
- 백엔드·외부 서비스·프레임워크 임의 추가 금지
- 토큰 출력·로그·코드·문서·Git 저장 금지

## Retry / HITL
- 동일 원인 Retry는 최대 3회
- 같은 fingerprint 연속 재발 시 추측 수정을 멈추고 중단한다
- 보존 범위, 공개 범위, 디자인 우선순위, 게임 규칙은 사람 확인 없이는 확정하지 않는다
- 토큰/비밀 파일 추적 또는 권한·배포 설정 변경이 필요하면 즉시 HITL로 전환한다

## Recent Loops
| Loop | 상태 | 실행 모드·모델 | 변경 파일 | 테스트 결과 | Retry | 다음 작업 |
|---|---|---|---|---|---:|---|
| 뱀서 상호작용 수정 | DEPLOYED | `CODEX_FALLBACK` / Claude 무응답 | `game-core.js`, `script.js`, `styles.css` | 로컬·Pages HTTP·선택 클릭·콘솔 `PASS` | 1 | 완료 |
| Step 7 전체 구현 | READY | `CODEX_WORKER + CLAUDE_VERIFIER` / `claude-sonnet-5` | `index.html`, `styles.css`, `script.js`, `game-core.js` | 로컬 HTTP, 375/768/1440, 링크, 콘솔, Snake, 뱀서 모드 `PASS` | 0 | 사용자 승인 후 배포 |
| Step 3 설계 | READY | `CODEX_WORKER + CLAUDE_VERIFIER` / `claude-sonnet-5` | `AORR.md`, `MEMORY.md` | 미실행 | 0 | 승인 후 기준선 테스트 |
| Step 1 분석 | READY | 문서 분석 | `STEP1_ANALYSIS.md` | 미실행 | 0 | 공개 범위·보존 목록 확정 |
| Step 4 복구 | READY | 문서 갱신 | `MEMORY.md` | 미실행 | 0 | 현재 상태 유지 |
| 2026 UI 재배치 | ACTING | `CODEX_FALLBACK` / `claude-sonnet-5` | `index.html`, `styles.css` | 미실행 | 0 | 공개 콘텐츠 정리 및 금융앱형 배치 적용 |
