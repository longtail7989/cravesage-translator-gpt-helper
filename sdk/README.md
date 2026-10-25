# Official SDK source and build

Pinned upstream: https://github.com/openai/sign-in-with-chatgpt-devkit/commit/0a36fefeb913055c8c7a1a29b63d82b96b2e841a . Local workspace `@siwc/local` version 0.1.0. Not npm-published. Upstream TypeScript source is unchanged.

Build from the standalone repository root using Node >=22.13: `node scripts/build-helper.mjs --offline`. The builder verifies the pinned source SHA-256 and all six dependency archive SHA-512 values against the upstream lock, erases TypeScript types with Node built-ins, preserves upstream licenses/notices, and reconstructs runtime only in disposable staging. It does not run npm, package lifecycle scripts, OAuth or inference. The source checkout deliberately contains no expanded SDK tree.

Runtime dependency closure: jose 6.2.12, openai 7.21.0, proper-lockfile 4.1.2, graceful-fs 4.2.11, retry 0.12.0, signal-exit 3.0.7. Their own license files must stay with each package. This is local helper SDK preparation, not a Codex/Claude install.

## Install payload allowlist

Copy `service.mjs`, the upstream `packages/local/package.json`, `packages/local/dist/**`, and only the above six upstream `node_modules/<name>/**` runtime package directories, retaining every package license. Preserve upstream relative layout because service's SDK import is pinned to it. Include this README and PINNED-SOURCE.json. Do not install npm-cache, downloads, upstream.tar.gz, upstream examples, dev packages or tests. The complete source archive/build recipe may remain a separate source distribution.

## Public contract

`await createService({storageDirectory,protect,unprotect,openBrowser?})`. Storage must be a host-owned ACL-restricted absolute directory; DPAPI CurrentUser callbacks take/return Uint8Array promises. They are mandatory, with no plaintext fallback. SDK profile files contain only a provider id and encrypted ciphertext; stable host UUID is separate nonsecret metadata. SDK storage serializes rotating refresh with a proper-lockfile interprocess lock. Service also owns a lifetime `.translator-service.lock` to prevent another process changing selected identity during requests; after a crash it fails closed. Only a host that independently proves the owner dead may clear a stale lease.

Methods: status(), startLogin({profileId?,newProfile?}), cancelLogin(), selectProfile(id), logout(id?), models(), translate({model,system,user},signal), close(). `system` is ignored. `user` is bounded untrusted JSON `{target,items:[{id,text,context?}]}`. Translation output is a JSON string `{translations:[{id,text}]}` validated for exact ids/fields and placeholders. `startLogin` returns pending state without awaiting the user flow. `close` is required on host shutdown. STATUS is protected local metadata only; MODELS can refresh OAuth but never performs inference. Models are visible official catalog entries, not an entitlement guarantee. Errors expose only allowlisted codes, never SDK/server messages, tokens or authorization URLs.

The SDK performs JOSE RS256 signature verification and issuer/audience/expiry/nonce/subject checks, state and PKCE validation, issued dynamic client-id persistence and direct-scope checks. `sendHostId:true` persists and sends the host UUID before OAuth. SDK intentionally omits ID-token authorization hints (per upstream security comment) but retains the ID token protected at rest. Switching/revoking cancels this service's inference; output epoch checks reject late results. Logout attempts official refresh-token revocation and retains account/client mapping even if remote revocation cannot be confirmed (`revocation_failed`).

The unmodified SDK uses only official public `/v1/models` and `/v1/responses`, with store:false, stream:true, no tools, retries=0 and 180s inference deadline. Service transport adds 2MiB response-body, 128KiB SSE-line, 256KiB translation-output limits and fixed-origin protection. Success requires SDK `response.completed`, not merely emitted text. The service exposes no URL/proxy/function/file endpoint.

Synthetic tests: `node --test service.test.mjs`. Test DI is trusted code only and must NEVER be accepted from extension/native messages. Identity validation is upstream code, not replaced by a custom OAuth implementation. No real sign-in or inference was attempted during implementation.

## Verification boundaries

The isolated standalone runner exercises 15 synthetic service tests with injected SDK behavior, plus 19 protocol tests. No real authentication, model inference, browser integration, installation or credential/keyring access is part of CI. Review actual build/test results independently from historical implementation notes.
