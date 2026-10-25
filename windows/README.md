# Windows 설치·업데이트·보호 저장소

Windows x64용 선택형 ChatGPT 도우미 안내입니다.
먼저 [전체 설치 안내](https://github.com/longtail7989/cravesaga-translator/blob/main/INSTALL.MD)와 [도우미 소개](../README.md)를 확인하세요.
**v0.3.5는 첫 공개 릴리스**이며 실제 새 PC 설치·로그인 성공을 보증하지 않습니다.

## 준비 사항

- Windows x64, 검증된 로컬 Node.js. **22.13 이상 권장**, 설치 스크립트의 런타임 하한은 22.12입니다.
- [릴리스 ZIP](https://github.com/longtail7989/cravesage-translator-gpt-helper/releases)과 외부 `SHA256SUMS.txt`. Node는 별도 준비해야 합니다.
- 현재 Windows 사용자 계정으로 실행합니다. 관리자 설치, HKLM 등록, PATH 변경, 전역 npm/CLI 설치, 예약 작업·자동 시작은 사용하지 않습니다.
- Node·설치 경로는 ASCII여야 하며 CMD 해석에 위험한 문자나 재분석 지점(링크 등)을 허용하지 않습니다.
- 허용 확장 ID는 `mfoolamgailfmmpddefkpnbfiecleefi` 하나입니다. 다른 PC·경로의 압축해제 확장도 ID가 같다고 가정하지 마세요.
- 배포물은 서명되지 않았습니다. 스크립트·배치·네이티브 메시징 정책이 막으면 중단하고 정상적인 정책 검토를 받으세요.
  실행 정책 우회, 출처 검사 해제, 레지스트리 브랜드 임의 추가는 해결책이 아닙니다.

## 1. 다운로드와 무결성 확인

외부 체크섬의 ZIP 이름과 다음 결과를 대조한 뒤 압축을 풉니다.

```powershell
Get-FileHash .\cravesage-translator-gpt-helper-0.3.5-windows-x64.zip -Algorithm SHA256
```

체크섬은 무결성 확인용이며 게시자 서명을 대신하지 않습니다.
ZIP 루트에는 `host.cjs`와 `windows/` 등이 있습니다. 소스 체크아웃은 실행 의존성이 펼쳐져 있지 않아 바로 설치할 수 없습니다.
설치 스크립트는 다운로드를 하지 않으며 필요한 파일이 빠지면 변경 전에 중단합니다.

## 2. 설치 미리 보기와 실행

압축을 푼 배포물의 `windows` 폴더에서 실행합니다.
아래 Node 경로는 예시입니다. **실제로 설치된 node.exe의 검증된 절대 경로**로 바꾸세요.
CLI·shim이 아닌 고정 실행 파일이어야 합니다. Node는 자동 다운로드·복사되지 않습니다.

```powershell
$node = 'C:\Tools\node\node.exe'
$install = "$env:LOCALAPPDATA\CraveAITranslator\chatgpt-helper"
& $node --version
.\install.ps1 -NodePath $node -InstallDir $install -WhatIf
# 경로와 변경 범위를 확인한 뒤 실제 설치
.\install.ps1 -NodePath $node -InstallDir $install
```

기본 설치 위치는 `%LOCALAPPDATA%\CraveAITranslator\chatgpt-helper`입니다.
사용자 프로필 경로가 ASCII 조건을 충족하지 않으면 안전한 별도 로컬 경로를 명시해야 합니다.
`-WhatIf`는 미리 보기이며 설치·연결·인증 성공 확인이 아닙니다. 확장은 자동 설치·업데이트를 하지 않습니다.

### 설치 시 변경되는 것

- 소유권 표식 `.crave-install.json`을 만들고 설치·백업 폴더 접근을 소유자와 SYSTEM으로 제한합니다.
- 기존의 확인된 자체 설치와 자체 HKCU 등록 양쪽 뷰를 변경 전에 백업합니다. 설치 오류 시 되돌리기를 시도합니다.
- `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.crave_ai_translator.chatgpt`의 32·64비트 뷰에 절대 매니페스트 경로를 등록합니다.
- 매니페스트는 `type: stdio`, 호스트 이름 `com.crave_ai_translator.chatgpt`,
  허용 출처 `chrome-extension://mfoolamgailfmmpddefkpnbfiecleefi/`만 사용합니다.
- 배치 실행기는 고정 Node·호스트 경로를 사용하고 `NODE_OPTIONS`·`NODE_PATH`를 비웁니다.
  `--storage-dir "<설치경로>\state"` 뒤에 브라우저 출처·창 인수를 전달하며 stdout에 상태 메시지를 출력하지 않습니다.

알 수 없는 기존 폴더·등록, Chromium의 우선 등록 충돌, 소스·대상 겹침, 재분석 지점, 위험한 경로는 거부합니다.
다른 사용자의 설치·등록을 덮어쓰거나 관리자 권한으로 우회하지 마세요.

## 3. 연결과 로그인

설치 후 확장에서 도우미 연결 상태를 확인하고 공식 로그인 절차를 진행합니다.
호스트는 정확한 확장 출처와 저장소를 검사하고 SDK 생성·상태 노출 전에 임의의 비인증 바이트로 DPAPI 왕복을 검사합니다.
실패하면 로그인을 막고 평문으로 대체하지 않습니다. 오류가 난 상태에서 인증을 반복하지 마세요.

일반 Chromium 소스는 Chrome 등록 키 폴백과 배치 호스트 실행을 지원합니다.
다만 Aside의 실제 빌드 브랜드·벤더 변경·기업 정책 및 실제 연결은 여기서 검증하지 않았습니다.
등록 완료만으로 Aside 연동 성공을 보장할 수 없습니다. 배치 실행이 정책상 금지되면 중단하세요.
별도 검토·서명·테스트된 stdio 전용 실행기 없이 임의 EXE를 만들어 배포하지 마세요.

## 업데이트와 삭제

기존의 확인된 자체 설치는 `-Upgrade`가 있어야 갱신합니다.
도우미·확장 연결을 먼저 종료하고 설치·삭제를 동시에 실행하지 마세요.
실행 중인 state·잠금을 덮어쓰거나 잠금 파일을 임의 삭제하지 마세요.

```powershell
# 새 릴리스 압축을 푼 windows 폴더에서 먼저 미리 보기
.\install.ps1 -NodePath $node -InstallDir $install -Upgrade -WhatIf
.\install.ps1 -NodePath $node -InstallDir $install -Upgrade
# 삭제도 먼저 미리 보기
.\uninstall.ps1 -InstallDir $install -WhatIf
.\uninstall.ps1 -InstallDir $install
# 파일까지 제거하려면 보호 상태를 포함한 전용 백업이 먼저 만들어집니다.
# .\uninstall.ps1 -InstallDir $install -RemoveFiles
```

기본 삭제는 일치하는 자체 HKCU 등록만 해제하고 파일·state는 남깁니다.
`-RemoveFiles`는 소유권이 확인된 설치를 백업한 뒤 제거합니다. 백업은 자동 삭제·자동 복원되지 않습니다.
백업에도 보호된 OAuth 데이터가 포함될 수 있으므로 비공개로 관리하세요.
업데이트는 기존 자체 설치의 state만 보존하며 배포 원본의 state를 가져오지 않습니다.

## 보호 저장소의 구현과 한계

`dpapi.cjs`는 Koffi 3.3.4를 통해 Windows DPAPI를 직접 호출합니다.
런타임 PowerShell·별도 프로세스·셸 명령을 사용하거나 실행 정책을 변경하지 않습니다.
설치·삭제 스크립트는 여전히 일반 PowerShell 정책을 따릅니다.

- `protect(bytes)`·`unprotect(bytes)`는 `Promise<Buffer>`,
  `protectSync(bytes)`·`unprotectSync(bytes)`는 `Buffer`를 반환합니다. 입력은 문자열이 아닌 Uint8Array/Buffer입니다.
- CurrentUser 범위, `CRYPTPROTECT_UI_FORBIDDEN=1`, 고정 애플리케이션 엔트로피를 사용합니다.
  LOCAL_MACHINE 플래그는 사용하지 않으며 prompt·reserved·description은 null입니다.
- Crypt32.dll·Kernel32.dll은 절대 System32 경로에서 로드합니다.
  크기를 제한한 네이티브 평문 할당은 덮어쓰기 후 Koffi로 해제하고 DPAPI 출력은 복사·덮어쓰기 후 LocalFree합니다.
- 보호 결과 형식은 `dpapi-current-user:v1:<base64>` 바이트입니다. 어댑터 자체는 상태 파일을 읽거나 쓰지 않습니다.
  서비스·SDK가 ACL 제한 저장소에 보호 결과만 원자적으로 저장하고 수명·갱신 잠금을 관리합니다.
- SDK 브라우저 훅 `openBrowser(url)`은 자격증명·비표준 포트가 없는 `https://auth.openai.com`만 허용합니다.
  제어문자·과대 입력을 거부하고 URL을 로그에 남기지 않습니다.
  System32의 Shell32.dll `ShellExecuteW`로 열며 반환값이 32보다 큰지 확인합니다. 저장소 초기화만으로 브라우저를 열지 않습니다.

DPAPI는 같은 Windows 사용자의 악성코드, 관리자/SYSTEM, 메모리 검사, Windows 프로필·마스터 키 탈취를 막지 못합니다.
JavaScript/SDK 문자열·OS 파이프 버퍼를 확실히 지울 수는 없습니다. 호출자는 반환 평문의 수명을 책임져야 합니다.
소유한 버퍼를 가능한 범위에서 지우며 **평문 대체 저장은 없습니다.** 다른 사용자·PC로 state를 복사해 로그인 이전을 시도하지 마세요.

## 고정 의존성과 배포 범위

공식 npm의 `koffi@3.3.4`와 `@koromix/koffi-win32-x64@3.3.4`만 사용합니다.
`vendor/PINNED-KOFFI.json`·`npm-metadata.json`에 아카이브 SHA-512와 파일별 SHA-256이 고정돼 있습니다.
공식 아카이브의 코어 87개·네이티브 5개 파일 목록을 검사하며 별도 보존한 원문 MIT 라이선스를 포함합니다.
네이티브 패키지는 `vendor/koffi/node_modules/@koromix/koffi-win32-x64`에만 둡니다.
전역 설치·컴파일러·npm 수명주기 스크립트는 사용하지 않으며 다른 플랫폼은 거부합니다.

설치 파일은 명시적 허용 목록으로 제한됩니다. 호스트·프로토콜·서비스, Windows 지원 파일,
SDK 핀·README·로컬 패키지 manifest/LICENSE/dist, 상위 라이선스·고지, 지정 런타임 의존성만 복사합니다.
아카이브·캐시·예제·개발 소스·테스트는 설치하지 않습니다. [SDK 안내](../sdk/README.md)를 참조하세요.
원문 라이선스·고지와 핀 메타데이터를 변경하거나 제거하지 마세요.

## 검증 범위와 문제 해결

Node 22 CI에서 격리된 프로토콜 19개·서비스 15개 테스트, 네이티브·브라우저 모의 테스트와 오프라인 빌드가 통과했습니다.
`test-native-mock.cjs`는 DLL·플래그·엔트로피·메모리 해제·오류 처리를 모의 검사하고,
`test-browser-mock.cjs`는 허용 URL·차단 URL·네이티브 실패 반환을 실제 브라우저 없이 검사합니다.
별도 `test-dpapi-bytes.cjs`는 실제 DPAPI의 합성 바이트 왕복·변조·크기 경계용이며 기본 CI 모의 검증과 다릅니다.
실제 자격증명을 테스트에 사용하지 마세요.

이 결과는 실제 새 PC 설치·DPAPI 작동·브라우저 연결·인증·추론 검증이 아닙니다.
실패 시 확장 ID, Node 경로·버전, 소유권·ACL, 정책 차단을 확인하세요. 보호 실패·정책 거부·잠금 충돌이 있으면 중단합니다.
토큰·프로필·state·백업·로그를 공개 이슈에 올리지 마세요.

### 참고 자료

- [Chrome 네이티브 메시징](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)
- [Chromium Windows 등록·실행 소스](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/extensions/api/messaging/launch_context_win.cc)
- [Chrome 공식 배치 호스트 예제](https://github.com/GoogleChrome/chrome-extensions-samples/blob/main/api-samples/nativeMessaging/host/native-messaging-example-host.bat)
- Koffi: [라이브러리 로드](https://koffi.dev/load), [포인터](https://koffi.dev/pointers)
