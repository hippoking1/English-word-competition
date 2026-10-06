import type { ExamAttempt, Player, Word } from '../types';
import { addToOfflineOutbox, getOfflineOutbox, removeFromOfflineOutbox } from './db';

export function normalizeGasUrl(raw: string): string {
  let url = (raw || '').trim();
  if (!url) return '';
  if (url.startsWith('https://script.google.com/macros/s/')) {
    if (!url.endsWith('/exec') && !url.endsWith('/dev')) {
      url = url.replace(/\/+$/, '') + '/exec';
    }
  }
  return url;
}

export function getGasConfig(): { url: string; token: string } {
  const rawUrl = localStorage.getItem('ewc_custom_gas_url') || import.meta.env.VITE_GAS_URL || '';
  const token = (localStorage.getItem('ewc_custom_gas_token') || import.meta.env.VITE_GAS_TOKEN || '').trim();
  const url = normalizeGasUrl(rawUrl);
  return { url, token };
}

export async function testGasConnection(
  customUrl?: string,
  customToken?: string
): Promise<{
  ok: boolean;
  message: string;
  flushedCount?: number;
  details?: any;
}> {
  const config = getGasConfig();
  const urlStr = customUrl !== undefined ? normalizeGasUrl(customUrl) : config.url;
  const token = customToken !== undefined ? customToken.trim() : config.token;

  if (!urlStr) {
    return { ok: false, message: '尚未輸入 GAS 網頁應用程式網址' };
  }

  if (urlStr.includes('/edit') || urlStr.includes('/macros/d/')) {
    return {
      ok: false,
      message: '您填入的是 Google Apps Script 編輯器網址，非部署網址！請至 Apps Script 點擊右上角「部署」>「管理部署作業」複製「網頁應用程式網址」（結尾為 /exec）。'
    };
  }

  try {
    const url = new URL(urlStr);
    url.searchParams.set('action', 'ping');
    if (token) url.searchParams.set('token', token);

    const res = await fetch(url.toString(), { method: 'GET' });

    if (res.status === 404) {
      return {
        ok: false,
        message: 'Google 回傳 404 (找不到網頁)。請檢查部署網址是否正確，結尾應為 /exec。'
      };
    }

    const text = await res.text();

    if (text.includes('accounts.google.com') || text.includes('ServiceLogin') || text.includes('<!DOCTYPE html>')) {
      return {
        ok: false,
        message: '權限不足（被 Google 轉向登入頁面）。請至 Apps Script 部署設定中，將「誰可以存取 (Who has access)」設定為「所有人 (Anyone)」。'
      };
    }

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return {
        ok: false,
        message: '回傳格式非 JSON，請確認是否為正確的 GAS 網頁應用程式 /exec 網址。'
      };
    }

    if (json.ok) {
      const flushedCount = await flushOfflineOutbox();
      return {
        ok: true,
        message: '連線成功！Google 試算表與權杖驗證正常。',
        flushedCount,
        details: json
      };
    } else {
      if (json.error === 'Unauthorized token') {
        return {
          ok: false,
          message: '權杖 (Token) 不符！目前填入的 Token 與 Google 試算表「Config」分頁中的 api_token 不一致。'
        };
      }
      return { ok: false, message: `GAS 回報錯誤: ${json.error}` };
    }
  } catch (err: any) {
    return {
      ok: false,
      message: `連線失敗: ${err.message || '網路異常或跨域 (CORS) 被阻擋。請確認 GAS 部署設定為「所有人」。'}`
    };
  }
}

export async function fetchPlayersFromCloud(): Promise<Player[] | null> {
  const { url: GAS_URL, token: GAS_TOKEN } = getGasConfig();
  if (!GAS_URL) return null;

  try {
    const url = new URL(GAS_URL);
    url.searchParams.set('action', 'players');
    if (GAS_TOKEN) url.searchParams.set('token', GAS_TOKEN);

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();
    if (json.ok && Array.isArray(json.players)) {
      return json.players.map((r: any) => ({
        id: String(r.player_id || r.id),
        nickname: String(r.nickname || ''),
        avatar: String(r.avatar || 'owl'),
        pinHash: String(r.pin_hash || r.pinHash || ''),
        salt: String(r.salt || ''),
        createdAt: String(r.created_at || r.createdAt || new Date().toISOString())
      }));
    }
  } catch (err) {
    console.warn('Failed to fetch players from cloud:', err);
  }
  return null;
}

export async function syncPlayersToCloud(players: Player[]): Promise<boolean> {
  const { url: GAS_URL, token: GAS_TOKEN } = getGasConfig();
  if (!GAS_URL || players.length === 0) return false;

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'syncPlayers',
        token: GAS_TOKEN,
        players: players.map(p => ({
          id: p.id,
          nickname: p.nickname,
          avatar: p.avatar,
          pinHash: p.pinHash,
          salt: p.salt,
          createdAt: p.createdAt
        }))
      })
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.ok;
    }
  } catch (err) {
    console.warn('Failed to sync players to cloud:', err);
  }
  return false;
}

export async function fetchWordsFromCloud(currentVersion?: string): Promise<{
  words?: Word[];
  version?: string;
  notModified?: boolean;
} | null> {
  const { url: GAS_URL, token: GAS_TOKEN } = getGasConfig();
  if (!GAS_URL) return null;

  try {
    const url = new URL(GAS_URL);
    url.searchParams.set('action', 'words');
    if (GAS_TOKEN) url.searchParams.set('token', GAS_TOKEN);
    if (currentVersion) url.searchParams.set('v', currentVersion);

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();
    if (json.ok) {
      return {
        words: json.words,
        version: json.version,
        notModified: json.notModified
      };
    }
  } catch (err) {
    console.warn('Failed to fetch words from cloud:', err);
  }
  return null;
}

export async function uploadWordsToCloud(
  words: Word[],
  overwrite = true
): Promise<{ ok: boolean; message: string; count?: number }> {
  const { url: GAS_URL, token: GAS_TOKEN } = getGasConfig();
  if (!GAS_URL) return { ok: false, message: '尚未設定 Google Apps Script 網址' };

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'importWords',
        token: GAS_TOKEN,
        overwrite,
        rows: words
      })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.ok) {
        return { ok: true, message: `成功匯入 ${json.count} 個單字至 Google 試算表！`, count: json.count };
      }
      return { ok: false, message: json.error || '匯入失敗' };
    }
    return { ok: false, message: `伺服器回應錯誤碼 HTTP ${res.status}` };
  } catch (err: any) {
    return { ok: false, message: `匯入失敗: ${err.message || '網路異常'}` };
  }
}

export async function submitAttemptToCloud(attempt: ExamAttempt): Promise<boolean> {
  const { url: GAS_URL, token: GAS_TOKEN } = getGasConfig();
  if (!GAS_URL) {
    await addToOfflineOutbox(attempt);
    return false;
  }

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'submitAttempt',
        token: GAS_TOKEN,
        attempt: {
          id: attempt.id,
          playerId: attempt.playerId,
          playerName: attempt.playerName,
          mode: attempt.mode,
          bank: attempt.bank,
          startedAt: attempt.startedAt,
          durationSec: attempt.durationSec,
          spellCorrect: attempt.spellCorrect,
          spellTotal: attempt.spellTotal,
          choiceCorrect: attempt.choiceCorrect,
          choiceTotal: attempt.choiceTotal,
          score: attempt.score,
          wrongWords: attempt.wrongWords.join(', '),
          resultsJson: JSON.stringify(
            Object.fromEntries(
              Object.entries(attempt.answers).map(([key, ans]) => [
                key,
                {
                  judge: ans.finalJudge,
                  user: ans.userText || ans.choiceSelected || ''
                }
              ])
            )
          )
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ok) {
        await removeFromOfflineOutbox(attempt.id);
        return true;
      }
    }
  } catch (err) {
    console.warn('Cloud submit failed, added to offline outbox:', err);
  }

  await addToOfflineOutbox(attempt);
  return false;
}

export async function flushOfflineOutbox(): Promise<number> {
  const { url: GAS_URL } = getGasConfig();
  if (!GAS_URL) return 0;

  const outbox = await getOfflineOutbox();
  let successCount = 0;
  for (const attempt of outbox) {
    const ok = await submitAttemptToCloud(attempt);
    if (ok) successCount++;
  }
  return successCount;
}
