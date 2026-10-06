/**
 * 國小英語單字王 - 一鍵初始化試算表與設定分頁
 * 包含：Words, Players, Attempts, Config
 */

function setup() {
  var spread = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Config
  var configSheet = getOrCreateSheet(spread, 'Config');
  configSheet.clear();
  configSheet.appendRow(['key', 'value']);
  var randomToken = Utilities.getUuid().substring(0, 16);
  configSheet.appendRow(['api_token', randomToken]);
  configSheet.appendRow(['words_version', String(Date.now())]);

  // 2. Words
  var wSheet = getOrCreateSheet(spread, 'Words');
  if (wSheet.getLastRow() === 0) {
    wSheet.appendRow(['id', 'bank', 'no', 'word', 'meaning', 'pos', 'category', 'alt_spellings', 'tags', 'enabled', 'note']);
  }

  // 3. Players
  var pSheet = getOrCreateSheet(spread, 'Players');
  if (pSheet.getLastRow() === 0) {
    pSheet.appendRow(['player_id', 'nickname', 'avatar', 'pin_hash', 'salt', 'created_at']);
  }

  // 4. Attempts
  var aSheet = getOrCreateSheet(spread, 'Attempts');
  if (aSheet.getLastRow() === 0) {
    aSheet.appendRow([
      'attempt_id',
      'player',
      'mode',
      'bank',
      'started_at',
      'duration_s',
      'spell_correct',
      'spell_total',
      'choice_correct',
      'choice_total',
      'score',
      'wrong_words',
      'results_json'
    ]);
  }

  Logger.log('=============================================');
  Logger.log('🎉 英語單字王試算表初始化成功！');
  Logger.log('你的專屬 API Token 為: ' + randomToken);
  Logger.log('請記得前往「部署」->「新增部署作業」->「網頁應用程式」進行發布！');
  Logger.log('執行身分：我 (Me)');
  Logger.log('誰可以存取：任何人 (Anyone)');
  Logger.log('=============================================');
}

function getOrCreateSheet(spread, name) {
  var sheet = spread.getSheetByName(name);
  if (!sheet) {
    sheet = spread.insertSheet(name);
  }
  return sheet;
}
