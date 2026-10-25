# cravesage-translator-gpt-helper (Windows x64)

Standalone repository: https://github.com/longtail7989/cravesage-translator-gpt-helper . This helper is deliberately separate from the extension repository. It is a native-messaging runtime and release ZIP, not a browser extension or a hosted service. API-key translation does not require it.

## Upstream license and service eligibility

**The bundled OpenAI SDK uses SIGN-IN WITH CHATGPT DEVKIT NONCOMMERCIAL LICENSE v1, not a permissive MIT/Apache license. Its use and redistribution must comply with that noncommercial license and its full retained notices.** No additional first-party license grant is asserted (package.json is UNLICENSED); this does not override bundled third-party terms. A helper release grants no ChatGPT/API service entitlement, account access, model access, or permission to bypass service restrictions. Review the full upstream `LICENSE` and `THIRD_PARTY_NOTICES.md` before use or redistribution.

## Important distribution limitation

**This build trusts only extension ID `mfoolamgailfmmpddefkpnbfiecleefi`.** Both `host.cjs` and `windows/common.ps1` enforce that ID. The separately maintained extension may not have a stable public `key`; unpacked extension IDs can depend on the local directory/browser profile. A ZIP unpacked on another machine/path, or a Chrome Web Store publication, can therefore have a different ID and fail native messaging. Copying the helper or updating the ZIP does not fix that. The publisher must establish a stable extension identity and review/update both exact allowlists before claiming general public compatibility. Do not weaken the origin checks or use a wildcard. Existing users moving their unpacked directory must recheck the ID.

This ZIP is an **unsigned, optional Windows x64 helper payload**, not an automatic installer/updater. It bundles the pinned SDK/dependencies and the Koffi x64 native binary, but **not Node.js**. Windows ARM64, ia32, macOS and Linux are not supported by this DPAPI adapter. Node >=22.12 is the installer's runtime floor; building requires Node >=22.13. Use the same exact Node build version to reproduce JavaScript type-erasure output.

## Build from a fresh checkout

```powershell
node scripts/build-helper.mjs --out dist
# If all nine pinned archives are present, require a completely offline build:
node scripts/build-helper.mjs --out dist --offline
# Optional release tag guard:
node scripts/build-helper.mjs --out dist --tag v0.3.5
```

Output: `dist/cravesage-translator-gpt-helper-<package.version>-windows-x64.zip`. Existing ZIPs are never overwritten. Extraction places `host.cjs` and the `windows/` directory at the ZIP root. No npm installation or lifecycle script is run. The build uses Node built-ins, reconstructs everything in a disposable directory, checks upstream SHA-256 and package SHA-512 pins, checks the full Koffi file inventory, preserves package licenses and notices, and removes the disposable tree. Expanded files in the checkout are never build inputs. Missing archives are fetched from the pinned URLs unless `--offline` is used; a present archive with a bad hash is rejected, not silently replaced.

The ZIP has lexically ordered entries, fixed 1980 timestamps, ZIP STORE encoding and no host filesystem metadata. `BUILD-INFO.json` records the build Node version and input archive hashes; `SHA256SUMS.txt` lists every payload file except itself. Repeated builds with the same tracked inputs and exact Node version are byte-for-byte reproducible. Build checksums are integrity evidence, not publisher signatures. The build never reads an installed helper, browser profiles, state or credential storage; it never installs, authenticates, starts the host or calls a model.

## Exact source control inputs

Keep only these helper inputs and this repository's package metadata/workflows/source-control rules (no extension sources):

- `scripts/build-helper.mjs`
- `{README.md,host.cjs,protocol.cjs,service.mjs}`
- `{protocol.test.cjs,service.test.mjs}` for synthetic testing
- `sdk/{README.md,PINNED-SOURCE.json}`
- `sdk/upstream.tar.gz`
- `sdk/downloads/{jose,openai,proper-lockfile,graceful-fs,retry,signal-exit}.tgz`
- `windows/{common.ps1,install.ps1,uninstall.ps1,dpapi.cjs,README.md}`
- `windows/{test-browser-mock.cjs,test-dpapi-bytes.cjs,test-native-mock.cjs}` for optional synthetic/platform tests
- `windows/vendor/{PINNED-KOFFI.json,npm-metadata.json,LICENSE-KOFFI.txt,koffi.tgz,koffi-win32-x64.tgz}`

The nine archive inputs can technically be omitted from Git because the builder fetches and hash-verifies them. Keeping them tracked makes offline reconstruction independent of registry availability and GitHub archive regeneration. No expanded third-party directory needs committing.

Exclude all `node_modules/`, the expanded `sdk/openai-sign-in-with-chatgpt-devkit-0a36fef/`, and expanded `windows/vendor/koffi/` from Git. Exclude generated `dist/`, `.helper-build-*/`, helper `state/`, profile files, tokens, local caches/logs, `.native-host.lock`, `.translator-service.lock`, `.crave-install.json`, native-host registration JSON, `launch-chatgpt.bat`, installation backups and registry snapshots. Never publish an installed helper directory or a browser profile. The builder copies only the explicit first-party file allowlist and archive-derived files, so those local trees are not release inputs.

## Exact release payload

- `README.md`, `host.cjs`, `protocol.cjs`, `service.mjs`
- `windows/{common.ps1,install.ps1,uninstall.ps1,dpapi.cjs,README.md}`
- `windows/vendor/{PINNED-KOFFI.json,npm-metadata.json,LICENSE-KOFFI.txt}`
- Full archive-derived `windows/vendor/koffi/**`, with the x64 archive under `koffi/node_modules/@koromix/koffi-win32-x64/**`; all package licenses retained
- `sdk/{README.md,PINNED-SOURCE.json}`
- Under `sdk/openai-sign-in-with-chatgpt-devkit-0a36fef/`: `LICENSE`, `THIRD_PARTY_NOTICES.md`, `README.md`, `packages/local/{package.json,LICENSE,dist/**}` and exactly `node_modules/{jose,openai,proper-lockfile,graceful-fs,retry,signal-exit}/**`
- Generated `BUILD-INFO.json` and `SHA256SUMS.txt`

No archive downloads, source build recipe, tests, development dependencies, upstream examples or local state enter the helper ZIP. Full runtime package trees are preserved rather than stripping license-bearing files. The upstream SDK has its own license/notices; see `sdk/README.md` and its pinned source. Koffi's retained native package and bundled notices must remain included when redistributing.

## Installation and verification boundaries

Read `windows/README.md` before installing. It documents explicit `node.exe` selection, user-scoped HKCU registration, ACLs, ownership, backups, upgrade and uninstall. Installer paths must be ASCII and shell-safe. The extension cannot install or update the helper automatically. Existing installations require the installer's explicit `-Upgrade` path; do not copy over live state or locks. This build does not modify any installer or origin policy.

`node scripts/test.mjs` runs 19 protocol + 15 service tests and mocked native/browser adapter tests in isolated canonical scratch space. It uses `realpathSync.native` for Windows short paths, strips inherited credentials and Node preloads, and passes only fixed safe NODE_OPTIONS path flags to nested children. Platform tests are separate; building a ZIP is not proof of installation, real DPAPI behavior, browser integration, account eligibility, sign-in success, model access or real inference. Never run login/model tests as part of a public release workflow.

## Helper-only CI and releases

CI uses the supported Node 22 line (the build records the exact resolved version) and runs the isolated synthetic tests plus an offline helper build. The version comes only from root `package.json`, not an extension manifest/core. A `v<package.version>` tag or manually dispatched Release workflow validates the exact tag, tests, builds the helper-only ZIP and generates external `SHA256SUMS.txt`. Manual publication requires the explicit publish input; otherwise the workflow uploads artifacts only. Release assets are exactly the ZIP and external checksum file. No extension build, npm install, login, model call, installation or registry mutation runs in CI.

Source checkout intentionally lacks expanded runtime dependencies; install only from an extracted release payload after reviewing the Windows guide. Keep `windows/vendor/** -text` in `.gitattributes`, including pinned metadata and license bytes. Runtime/auth/installer sources are unchanged; only packaging, documentation, isolated test runner and automation were adapted.

## Local standalone verification

The offline helper build succeeded on Node 26.5.0: 3,806 ZIP entries, with all nine archive pins and complete native file inventory verified. All 15 service tests and both native/browser mock entrypoints passed. Locally, protocol tests 1-18 passed but the final nested byte-stream Node child timed out; this is a known local Node 26/sandbox fixture limitation, not a full 19-test pass. CI deliberately uses Node 22, where the parent project had verified all 19 protocol tests with canonical temporary paths. This new standalone repository still needs its own green GitHub CI run before release publication. No live DPAPI, install, auth or inference was attempted.
