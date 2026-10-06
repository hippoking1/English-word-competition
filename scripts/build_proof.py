import csv
import json

# Read data/words.csv
words = []
with open("data/words.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        words.append(row)

html_content = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>英文400單 題庫原卷對照校對表</title>
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: #f8fafc;
    }}
    .left-panel {{
      flex: 1.2;
      display: flex;
      flex-direction: column;
      border-right: 2px solid #cbd5e1;
      background: #334155;
    }}
    .toolbar {{
      padding: 10px 16px;
      background: #1e293b;
      color: white;
      display: flex;
      gap: 10px;
      align-items: center;
      font-size: 14px;
    }}
    .toolbar button {{
      padding: 6px 14px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
    }}
    .toolbar button.active {{
      background: #10b981;
    }}
    .img-container {{
      flex: 1;
      overflow: auto;
      display: flex;
      justify-content: center;
      padding: 16px;
    }}
    .img-container img {{
      max-width: 100%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      border-radius: 4px;
      background: white;
    }}
    .right-panel {{
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
    }}
    .right-header {{
      padding: 12px 20px;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .search-input {{
      padding: 6px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 14px;
      width: 220px;
    }}
    .table-container {{
      flex: 1;
      overflow-y: auto;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }}
    th {{
      position: sticky;
      top: 0;
      background: #e2e8f0;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      color: #334155;
      border-bottom: 2px solid #cbd5e1;
    }}
    td {{
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }}
    tr:hover td {{
      background: #f8fafc;
    }}
    .badge {{
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      background: #e0f2fe;
      color: #0369a1;
    }}
    .word-text {{
      font-weight: 700;
      font-size: 15px;
      color: #0f172a;
    }}
  </style>
</head>
<body>
  <div class="left-panel">
    <div class="toolbar">
      <span>切換頁數：</span>
      <button onclick="setPage(1)" id="btn-1" class="active">第 1 頁 (1~72)</button>
      <button onclick="setPage(2)" id="btn-2">第 2 頁 (73~154)</button>
      <button onclick="setPage(3)" id="btn-3">第 3 頁 (155~236)</button>
      <button onclick="setPage(4)" id="btn-4">第 4 頁 (237~318)</button>
      <button onclick="setPage(5)" id="btn-5">第 5 頁 (319~400)</button>
    </div>
    <div class="img-container">
      <img id="page-img" src="./source-pages/p1.jpg" alt="原始題庫">
    </div>
  </div>
  <div class="right-panel">
    <div class="right-header">
      <h3 style="margin:0;">宜蘭縣國小英語單字王 400 單 (轉錄校對表)</h3>
      <input type="text" class="search-input" id="search" placeholder="搜尋英文或中文..." oninput="filterTable()">
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">編號</th>
            <th style="width: 140px;">英文單字</th>
            <th style="width: 160px;">中文解釋</th>
            <th style="width: 60px;">詞性</th>
            <th style="width: 80px;">分類</th>
            <th>其他可接受拼法</th>
          </tr>
        </thead>
        <tbody id="tbody">
        </tbody>
      </table>
    </div>
  </div>

  <script>
    const allWords = {json.dumps(words, ensure_ascii=False)};
    
    function setPage(p) {{
      document.getElementById('page-img').src = './source-pages/p' + p + '.jpg';
      for (let i = 1; i <= 5; i++) {{
        document.getElementById('btn-' + i).classList.toggle('active', i === p);
      }}
      // Scroll to that range in table
      const ranges = {{ 1: 1, 2: 73, 3: 155, 4: 237, 5: 319 }};
      const targetNo = ranges[p];
      const targetEl = document.getElementById('row-' + targetNo);
      if (targetEl) {{
        targetEl.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
      }}
    }}

    function renderTable(list) {{
      const tbody = document.getElementById('tbody');
      tbody.innerHTML = list.map(w => `
        <tr id="row-${{w.no}}">
          <td><b>${{w.no}}</b></td>
          <td class="word-text">${{w.word}}</td>
          <td>${{w.meaning}}</td>
          <td><span class="badge">${{w.pos || '-'}}</span></td>
          <td><span class="badge" style="background:#fef3c7;color:#92400e;">${{w.category || '-'}}</span></td>
          <td style="color:#64748b;font-size:12px;">${{w.alt_spellings || '-'}}</td>
        </tr>
      `).join('');
    }}

    function filterTable() {{
      const q = document.getElementById('search').value.toLowerCase().trim();
      if (!q) {{
        renderTable(allWords);
        return;
      }}
      const filtered = allWords.filter(w => 
        w.word.toLowerCase().includes(q) || 
        w.meaning.includes(q) || 
        String(w.no).includes(q)
      );
      renderTable(filtered);
    }}

    renderTable(allWords);
  </script>
</body>
</html>
"""

with open("public/proof.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Generated public/proof.html successfully.")
