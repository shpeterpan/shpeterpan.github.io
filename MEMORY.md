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
- 상태: `DEPLOY_APPROVAL_REQUIRED` (현재 사용자 메시지에서 배포 승인 완료)
- 실행 모드: `CODEX_FALLBACK`
- Claude 모델: `claude-sonnet-5`
- 현재 commit: `b6a8f97`
- 마지막 정상 commit·URL: `b6a8f97`, `https://shpeterpan.github.io/` (HTTP 200)
- Git 상태: `main...origin/main`, tracked 변경 없음; untracked `.DS_Store`, `.tmp-*.png`, `AUTOMATION_READINESS.md`, `CHANGE_REQUEST.md`, `STEP1_ANALYSIS.md`, `claude-code-cli/`, `samsung-agent-education2-main/`
- Rollback 기준: 이번 루프에서 수정·추가한 파일만 되돌리고, 배포 실패 시 마지막 정상 배포 커밋 `b6a8f97`로 복구한다.
- 진행 루프: 검수 결함 6건 수정과 회귀 테스트 추가 완료, 사용자 배포 승인에 따라 commit·push·배포본 검증 진행
- 다음 루프: 비밀정보 검사 → commit/push → HTTP 200 → 배포본 회귀
- Retry: `1`
- fingerprint: `없음` (6개 기존 fingerprint 제거 확인)
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
| Code Review Fix and Deploy | DEPLOY_APPROVAL_REQUIRED | `CODEX_FALLBACK` / Claude 무응답 | `index.html`, `styles.css`, `script.js`, `game-core.js`, `tests/regression.mjs`, 기록 | Node 5 checks, 375/768/1440 브라우저 회귀 `PASS` | 1 | 승인된 배포·배포본 검증 |
| Margin Alignment Pass | ACTING | `CODEX_FALLBACK` / Claude verifier unavailable | `styles.css`, `MEMORY.md`, `AORR_LOG.md` | 로컬 HTTP, 1440/390 캡처 `PASS` | 2 | 필요 시 카드 비율 미세 조정 |
| Icon and Illustration Pass | READY | `CODEX_FALLBACK` / Claude verifier unavailable | `index.html`, `styles.css`, `AORR_LOG.md` | desktop/mobile screenshots `PASS` | 1 | 완료 |
