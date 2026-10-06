/**
 * 國小英語單字王 - Google Apps Script Backend Web App
 */

function ss() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function cfg(key) {
  var sheet = ss().getSheetByName('Config');
  if (!sheet) return '';
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == key) return String(data[i][1]);
  }
  return '';
}

function setCfg(key, val) {
  var sheet = ss().getSheetByName('Config');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == key) {
      sheet.getRange(i + 1, 2).setValue(val);
      return;
    }
  }
  sheet.appendRow([key, val]);
}

function readSheet(sheetName) {
  var sheet = ss().getSheetByName(sheetName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = values[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  var token = p.token || '';
  var serverToken = cfg('api_token');

  if (serverToken && token !== serverToken) {
    return jsonResponse({ ok: false, error: 'Unauthorized token' });
  }

  var action = p.action;

  if (action === 'ping') {
    return jsonResponse({
      ok: true,
      message: 'pong',
      wordsCount: readSheet('Words').length,
      playersCount: readSheet('Players').length,
      attemptsCount: readSheet('Attempts').length,
      version: cfg('words_version')
    });
  }

  if (action === 'words') {
    var currentVer = cfg('words_version');
    if (p.v && p.v === currentVer) {
      return jsonResponse({ ok: true, notModified: true, version: currentVer });
    }
    var words = readSheet('Words');
    var enabledOnly = words.filter(function(w) {
      return w.enabled === true || w.enabled === 'TRUE' || w.enabled === 'true' || w.enabled === '';
    });
    return jsonResponse({ ok: true, version: currentVer, words: enabledOnly });
  }

  if (action === 'players') {
    var players = readSheet('Players');
    return jsonResponse({ ok: true, players: players });
  }

  if (action === 'attempts') {
    var allAttempts = readSheet('Attempts');
    var filtered = allAttempts;
    if (p.pid) {
      filtered = allAttempts.filter(function(r) { return String(r.player).indexOf(p.pid) !== -1; });
    }
    return jsonResponse({ ok: true, rows: filtered });
  }

  return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
}

function doPost(e) {
  var body = {};
  try {
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Invalid JSON payload' });
  }

  var serverToken = cfg('api_token');
  if (serverToken && body.token !== serverToken) {
    return jsonResponse({ ok: false, error: 'Unauthorized token' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var action = body.action;

    if (action === 'syncPlayers') {
      var playersList = body.players || [];
      var pSheet = ss().getSheetByName('Players');
      if (!pSheet) {
        pSheet = ss().insertSheet('Players');
        pSheet.appendRow(['player_id', 'nickname', 'avatar', 'pin_hash', 'salt', 'created_at']);
      }
      var data = pSheet.getDataRange().getValues();
      var idRowMap = {};
      for (var pIdx = 1; pIdx < data.length; pIdx++) {
        idRowMap[String(data[pIdx][0])] = pIdx + 1;
      }

      for (var k = 0; k < playersList.length; k++) {
        var pl = playersList[k];
        var rowNum = idRowMap[String(pl.id)];
        if (rowNum) {
          pSheet.getRange(rowNum, 2, 1, 5).setValues([[
            pl.nickname,
            pl.avatar,
            pl.pinHash,
            pl.salt,
            pl.createdAt
          ]]);
        } else {
          pSheet.appendRow([
            pl.id,
            pl.nickname,
            pl.avatar,
            pl.pinHash,
            pl.salt,
            pl.createdAt
          ]);
          idRowMap[String(pl.id)] = pSheet.getLastRow();
        }
      }
      return jsonResponse({ ok: true, count: playersList.length });
    }

    if (action === 'submitAttempt') {
      var a = body.attempt;
      var sheet = ss().getSheetByName('Attempts');
      if (!sheet) {
        sheet = ss().insertSheet('Attempts');
        sheet.appendRow([
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

      // Check duplicates
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] == a.id) {
          return jsonResponse({ ok: true, message: 'Already recorded' });
        }
      }

      var playerDisplay = a.playerName ? a.playerName + ' (' + a.playerId + ')' : a.playerId;

      sheet.appendRow([
        a.id,
        playerDisplay,
        a.mode,
        a.bank || '',
        a.startedAt,
        a.durationSec,
        a.spellCorrect,
        a.spellTotal,
        a.choiceCorrect,
        a.choiceTotal,
        a.score,
        a.wrongWords || '',
        a.resultsJson
      ]);

      return jsonResponse({ ok: true });
    }

    if (action === 'importWords') {
      var rows = body.rows || [];
      var wSheet = ss().getSheetByName('Words');
      if (!wSheet) {
        wSheet = ss().insertSheet('Words');
      }
      if (wSheet.getLastRow() === 0) {
        wSheet.appendRow(['id', 'bank', 'no', 'word', 'meaning', 'pos', 'category', 'alt_spellings', 'tags', 'enabled', 'note']);
      }
      if (body.overwrite) {
        var lastR = wSheet.getLastRow();
        if (lastR > 1) {
          wSheet.getRange(2, 1, lastR - 1, 11).clearContent();
        }
      }
      if (rows.length > 0) {
        var matrix = rows.map(function(r) {
          return [
            r.id,
            r.bank || 'yilan113',
            r.no || 0,
            r.word,
            r.meaning,
            r.pos || '',
            r.category || '',
            r.alt_spellings || '',
            r.tags || '',
            r.enabled !== false,
            r.note || ''
          ];
        });
        var startRow = wSheet.getLastRow() + 1;
        wSheet.getRange(startRow, 1, matrix.length, 11).setValues(matrix);
      }
      setCfg('words_version', String(Date.now()));
      return jsonResponse({ ok: true, count: rows.length });
    }

    return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  } finally {
    lock.releaseLock();
  }
}

function onEdit(e) {
  if (e && e.range && e.range.getSheet().getName() === 'Words') {
    setCfg('words_version', String(Date.now()));
  }
}
