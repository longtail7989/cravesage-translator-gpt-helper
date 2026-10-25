# 공식 SDK·인증·재현 빌드

이 도우미는 OpenAI의 공식 Sign in with ChatGPT Devkit 로컬 SDK를 사용합니다.
SDK를 별도 OAuth 구현으로 대체하거나 Codex·Claude CLI를 설치하는 방식이 아닙니다.
설치부터 진행하려면 [Windows 안내](../windows/README.md), 전체 구성은 [설치 문서](https://github.com/longtail7989/cravesaga-translator/blob/main/INSTALL.MD)를 참조하세요.

## 고정된 원본과 라이선스

- 업스트림: [openai/sign-in-with-chatgpt-devkit](https://github.com/openai/sign-in-with-chatgpt-devkit)
- 고정 커밋: [0a36fefeb913055c8c7a1a29b63d82b96b2e841a](https://github.com/openai/sign-in-with-chatgpt-devkit/commit/0a36fefeb913055c8c7a1a29b63d82b96b2e841a)
- 로컬 워크스페이스: `@siwc/local` 0.1.0, npm에 게시된 패키지가 아닙니다.
- 원본·의존성 해시: [PINNED-SOURCE.json](PINNED-SOURCE.json). 업스트림 TypeScript 원본은 수정하지 않습니다.

**SDK는 SIGN-IN WITH CHATGPT DEVKIT NONCOMMERCIAL LICENSE v1.0 적용 대상입니다.**
개인 학습·실험·개발 등 원문이 정한 비상업적 목적 범위만 허용합니다.
사업체·고용주·고객을 위한 운영·상업적 이익과 관련된 개발·시험·배포는 무료여도 그 정의에서 제외될 수 있습니다.
비영리 지위만으로 비상업적 목적이 성립하지 않으며, OpenAI 기여분의 상업적 사용에는 별도 서면 계약이 필요합니다.

이 설명은 라이선스 원문을 대체하지 않습니다. 배포물의 `LICENSE`·`THIRD_PARTY_NOTICES.md`와 각 패키지 라이선스를 보존하세요.
원문 라이선스·고지·핀 JSON·아카이브를 번역하거나 고치지 마세요.
자체 패키지는 `UNLICENSED`이며 이 문서는 새 권리를 부여하지 않습니다. 이는 제삼자 라이선스를 덮어쓰지 않습니다.
SDK 라이선스나 도우미 배포는 ChatGPT·API 이용권, 계정·모델 접근권, 상표 사용권을 부여하지 않습니다.

## 로그인과 실제 이용 가능 조건

공식 SDK가 JOSE RS256 서명과 issuer·audience·expiry·nonce·subject, OAuth state·PKCE를 검증합니다.
동적 등록 client ID와 직접 사용 scope를 저장·검사합니다. 이메일은 표시용이며 검증된 계정 subject를 대신하지 않습니다.
`sendHostId:true` 설정으로 비밀이 아닌 안정된 호스트 UUID를 OAuth 전에 저장·전송합니다.
업스트림 보안 설계에 따라 ID 토큰을 인증 힌트로 보내지 않으며 저장 시에는 보호합니다.

- SDK 상태가 `connected`이고 자격증명이 있으며 `chatgpt.tokens.use.direct` scope가 있어야 공유가 활성화됩니다.
- 도우미 `planEnabled`는 연결 및 공유 상태를 나타낼 뿐 특정 요금제 이름·정액 무제한 이용을 보장하지 않습니다.
- `/v1/models`의 `visibility: "list"` 항목 중 유효한 slug·display_name만 사용합니다.
- 서비스는 번역 직전 공식 목록을 다시 확인해 요청 모델 ID가 없으면 `invalid_model`로 거부합니다.
- 로그인·모델 표시와 실제 추론 권한은 별개입니다. 계정 자격, 공유 설정, 사용량·모델 제한 등 서버 판단을 그대로 따릅니다.
  `sharing_not_enabled`·`subscription_sharing_*` 등의 거부를 무시하거나 다른 엔드포인트로 우회하지 않습니다.

프로필 전환·로그아웃은 진행 중 번역을 취소하고 세대 검사를 통해 이전 계정의 늦은 결과를 버립니다.
로그아웃은 공식 refresh-token 취소를 시도합니다. 원격 취소가 확인되지 않으면 `revocation_failed`를 반환하며
계정·클라이언트 매핑은 유지될 수 있습니다. 로컬 종료만으로 원격 취소 완료를 주장하지 않습니다.

## 보호 저장소와 서비스 계약

신뢰된 네이티브 호스트가 `await createService({storageDirectory,protect,unprotect,openBrowser?})`로 생성합니다.
저장소는 호스트 소유의 ACL 제한 절대 경로여야 하며 DPAPI CurrentUser 콜백은 필수입니다.
콜백은 Uint8Array를 받고 Promise로 바이트를 반환합니다. 임의의 비인증 바이트로 보호 왕복을 증명하기 전에는 SDK를 생성하지 않습니다.
평문 대체 저장은 없습니다. SDK 프로필 저장 파일에는 보호 공급자 ID와 암호문을 저장하고 호스트 UUID는 별도 비밀 아닌 메타데이터로 둡니다.

SDK는 `proper-lockfile` 프로세스 간 잠금으로 회전 갱신·저장을 직렬화합니다.
서비스는 수명 동안 `.translator-service.lock`을 보유해 다른 프로세스의 계정 변경을 막습니다.
비정상 종료 후에는 안전하게 중단하며, 소유 프로세스가 죽었다는 독립적인 확인 없이 잠금을 지우면 안 됩니다.
DPAPI의 사용자 범위·메모리 보호 한계와 백업 관리는 [Windows 안내](../windows/README.md)를 따릅니다.

서비스 메서드는 `status()`, `startLogin({profileId?,newProfile?})`, `cancelLogin()`,
`selectProfile(id)`, `logout(id?)`, `models()`, `translate({model,system,user},signal)`, `close()`입니다.
로그인 시작은 사용자 인증 완료를 기다리지 않고 대기 상태를 반환합니다. 종료 시 `close()`가 필요합니다.

- STATUS는 보호된 로컬 상태·계정 메타데이터만 반환합니다. 토큰이나 SDK 응답 원본을 확장으로 내보내지 않습니다.
- MODELS는 OAuth 갱신을 할 수 있지만 추론은 하지 않습니다.
- 오류는 허용된 코드만 공개하며 SDK·서버 메시지, 토큰, 인증 URL을 노출하지 않습니다.
- 테스트 의존성 주입 `testDI`는 신뢰된 테스트 코드 전용입니다. 확장·네이티브 메시지에서 절대 받지 않습니다.

## 번역·통신 경계

확장 출처는 `chrome-extension://mfoolamgailfmmpddefkpnbfiecleefi/`만 허용합니다.
SDK 통신은 공식 `https://auth.openai.com`·`https://api.openai.com` 출처로 제한하고 리다이렉트·URL 자격증명·쿼리·해시를 거부합니다.
API 경로는 `/v1/models`와 `/v1/responses`뿐입니다. 임의 URL·프록시·함수·파일 엔드포인트를 제공하지 않습니다.
브라우저 로그인 열기는 Windows 네이티브 훅의 엄격한 인증 출처 검사를 추가로 따릅니다.

호출자가 제공한 `system`은 무시합니다. 서비스 고정 번역 지침만 사용합니다.
`user`는 신뢰하지 않는 JSON `{target,items:[{id,text,context?}]}`이며 텍스트·문맥·언어명은 명령이 아닌 데이터로 취급합니다.
번역 외 도구·파일·계정 접근이나 장면 추가·이야기 이어쓰기를 지시하지 않으며 적용되는 안전 요건을 따릅니다.

- 입력 JSON 최대 96 KiB, 항목 1~64개, 고유 ID, text 8,192자·context 2,048자, 합계 24,000자 제한.
- 결과는 JSON 문자열 `{translations:[{id,text}]}`이며 정확한 ID·필드와 `⟦...⟧` 플레이스홀더 순서·일치를 검사합니다.
- 공식 응답 요청은 `store:false`, `stream:true`, 도구 없음, 재시도 0회, 추론 제한 시간 180초입니다.
- 응답 본문 2 MiB, SSE 한 줄 128 KiB, 번역 출력 256 KiB 제한을 추가 적용합니다.
- 일부 텍스트 수신만으로 성공 처리하지 않습니다. SDK `response.completed`와 출력 검증을 통과해야 합니다.

## 소스에서 독립 빌드

Node.js **22.13 이상**으로 저장소 루트에서 실행합니다.

```powershell
node scripts/build-helper.mjs --out dist --offline
# 버전·태그도 검사하려면
node scripts/build-helper.mjs --out dist --offline --tag v0.3.5
```

고정 아카이브는 SDK 원본 1개, 런타임 의존성 6개, Koffi 2개로 총 9개입니다.
`--offline`은 누락 시 실패합니다. 이 옵션이 없으면 고정 URL에서 누락분만 가져옵니다.
이미 있는 아카이브의 해시가 틀리면 자동 교체하지 않고 거부합니다.
원본 SHA-256, 업스트림 잠금 기반 패키지 SHA-512, Koffi 전체 파일 목록을 검증합니다.

Node 내장 `module.stripTypeScriptTypes`의 strip 모드로 타입만 제거하고 원본 소스 패치는 하지 않습니다.
npm 설치·수명주기 스크립트·OAuth·추론은 실행하지 않습니다.
매번 임시 스테이징에서 재구성하므로 체크아웃의 펼쳐진 SDK·node_modules·설치 폴더·브라우저 프로필·state는 빌드 입력이 아닙니다.
완료 후 스테이징을 제거합니다.

런타임 의존성은 jose 6.2.12, openai 7.21.0, proper-lockfile 4.1.2,
graceful-fs 4.2.11, retry 0.12.0, signal-exit 3.0.7입니다. 각 패키지의 전체 런타임 트리와 라이선스를 유지합니다.

ZIP은 사전순 경로·1980년 고정 시간·STORE 인코딩을 사용하고 호스트 파일시스템 메타데이터를 담지 않습니다.
정확히 같은 Node 빌드 버전과 추적 입력이 같아야 동일 바이트 재현을 기대할 수 있습니다.
`BUILD-INFO.json`에 Node 버전·입력 해시, 내부 `SHA256SUMS.txt`에 자신을 제외한 페이로드 해시를 기록합니다.
기존 ZIP은 덮어쓰지 않습니다. 해시는 무결성 자료이며 게시자 서명은 아닙니다.

## 소스 관리와 배포 파일 범위

소스에는 호스트·프로토콜·서비스·합성 테스트, 빌드·검사 스크립트, Windows 지원·테스트,
README·CHANGELOG·패키지 메타데이터·워크플로, SDK·Koffi 핀·원문 라이선스·고정 아카이브를 유지합니다.
아카이브를 추적하면 레지스트리 가용성·GitHub 아카이브 재생성에 의존하지 않고 오프라인 재구성할 수 있습니다.
`windows/vendor/** -text` 규칙을 유지해 메타데이터·라이선스 바이트를 보존하세요.

배포 ZIP에는 다음만 포함합니다.

- 루트 README, host.cjs, protocol.cjs, service.mjs.
- Windows common/install/uninstall.ps1, dpapi.cjs, README와 Koffi 핀·메타데이터·원문 라이선스·전체 x64 런타임.
- sdk/README.md·PINNED-SOURCE.json, 원본 LICENSE·THIRD_PARTY_NOTICES.md·README.
- `sdk/openai-sign-in-with-chatgpt-devkit-0a36fef/packages/local/{package.json,LICENSE,dist/**}`와 위 여섯 node_modules 패키지.
- 생성된 BUILD-INFO.json·내부 SHA256SUMS.txt.

아카이브·빌드 레시피·테스트·개발 의존성·업스트림 예제·로컬 상태는 배포 ZIP에 들어가지 않습니다.
설치 허용 목록은 이 배포 범위에서 실행에 필요한 파일만 복사합니다. SDK 상대 경로를 임의로 바꾸지 마세요.
node_modules·펼쳐진 SDK/Koffi·dist·임시 빌드 트리·state·프로필·토큰·캐시·로그·잠금·설치 표식·등록 JSON·
생성된 실행기·설치 백업·레지스트리 스냅샷을 소스에 추가하지 마세요. 설치된 폴더나 브라우저 프로필을 배포해서는 안 됩니다.

## 격리 검증과 릴리스

`node scripts/test.mjs`는 임시 정규 경로에서 프로토콜 19개·서비스 15개 테스트와 네이티브·브라우저 모의 테스트를 실행합니다.
`realpathSync.native`로 Windows 짧은 경로를 정규화하고 별도 HOME·프로필·임시 경로를 사용합니다.
상속된 자격증명 환경 변수와 Node 사전 로드를 제거하며 중첩 자식에는 고정된 안전 경로 플래그만 전달합니다.
실제 설치·레지스트리 변경·브라우저 실행·OAuth·모델 호출은 포함하지 않습니다.

첫 공개 배포의 독립 저장소 Node 22 CI 및 Release 작업은 통과했습니다.
실제 DPAPI 합성 시험은 별도 플랫폼 검사이며, 모의 테스트를 실제 암호화·새 PC 설치·인증·추론 검증으로 확대 해석하지 마세요.
실제 로그인·모델 시험을 공개 릴리스 워크플로에 추가하지 마세요.

버전은 루트 package.json만 기준으로 합니다. 태그 푸시나 기존 태그를 지정하는 수동 실행은 해당 태그를 체크아웃합니다.
태그·버전 일치, 격리 테스트와 오프라인 빌드 후 ZIP 및 외부 SHA256SUMS.txt만 게시합니다.
GitHub CLI 게시 단계는 체크섬을 검증하고 기존 자산이 동일한지 확인하며 다른 파일로 덮어쓰지 않습니다.
번역 확장 소스·빌드는 이 저장소의 배포에 포함하지 않습니다.
