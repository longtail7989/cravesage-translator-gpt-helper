#!/usr/bin/env node
// Synthetic/offline only: no installed helper, profile, credentials, OAuth or model.
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,rmSync,realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
const root=fileURLToPath(new URL('../',import.meta.url));
// Windows TEMP can use an 8.3 alias. Canonicalize before strict storage checks.
const scratch=realpathSync.native(mkdtempSync(path.join(os.tmpdir(),'cravesage-helper-test-')));
let failed=0;
try {
 const home=path.join(scratch,'home');mkdirSync(home);
 const env={...process.env,HOME:home,USERPROFILE:home,APPDATA:path.join(home,'AppData','Roaming'),LOCALAPPDATA:path.join(home,'AppData','Local'),TEMP:scratch,TMP:scratch,TMPDIR:scratch};
 for(const key of Object.keys(env)) if(/(?:TOKEN|SECRET|PASSWORD|API_KEY|APIKEY|AUTHORIZATION)/i.test(key)||/^NODE_(OPTIONS|PATH)$/i.test(key)) delete env[key];
 // Inherited by the protocol test's nested Node child: safe fixed flags only.
 env.NODE_OPTIONS='--preserve-symlinks --preserve-symlinks-main';
 for(const file of ['protocol.test.cjs','service.test.mjs','windows/test-native-mock.cjs','windows/test-browser-mock.cjs']) {
  console.log('\n=== '+file+' ===');
  const result=spawnSync(process.execPath,['--preserve-symlinks','--preserve-symlinks-main',path.join(root,file)],{cwd:scratch,env,stdio:'inherit',timeout:120000});
  if(result.error||result.status!==0){failed++;console.error('FAILED '+file,result.error?.message||result.signal||result.status);}
 }
} finally {rmSync(scratch,{recursive:true,force:true});}
console.log(failed?'FAILED: '+failed+' helper entrypoint(s)':'PASS: isolated helper protocol/service suites and mocked native/browser adapters.');
if(failed)process.exitCode=1;
