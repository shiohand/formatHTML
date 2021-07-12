init();

function init() {
  // メイン使用要素
  const pasteBox = document.getElementById('htmlfmt-paste-box');
  const outputBox = document.getElementById('htmlfmt-output-box');
  const previewBox = document.getElementById('htmlfmt-preview-box');

  // リセット
  outputBox.value = '';

  // イベントハンドラ
  pasteBox.addEventListener('input', outputHTML);
  pasteBox.addEventListener('click', e => e.target.select()); // click時全選択（ついで）
  outputBox.addEventListener('click', e => e.target.select());

  // 空要素
  let emptyTags = ['meta', 'link', 'img', 'br', 'hr', 'input', '!DOCTYPE html'];
  emptyTags.push(...['source', 'feColorMatrix', 'base']);
  // 消す空要素
  let removeEmptyTags = ['link', 'meta'];
  removeEmptyTags.push(...['source', 'feColorMatrix', 'base']);
  // 消す最小要素(子要素を持たないもの)
  let removeElements = ['style', 'script'];

  // 消すタグ
  // 'b', 'i', 'u', 's' などを含めると'img'や'body'も死ぬので時間のある時考える
  let removeTags = ['span', 'div', 'iframe'];
  removeTags.push(...['wix-image', 'wix-video', 'wix-dropdown-menu', 'pages-css', 'mask', 'defs', 'use', 'image', 'filter', 'fe']);
  removeTags.push(...['svg', 'g', 'text', 'circle', 'path']);
  // タグの内側で改行しないもの
  let exceptReturn = ['title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'li', 'button', 'strong', 'th', 'td'];
  // やっぱり改行するもの（改行しないものに巻き込まれたものたち）
  let cancelExceptReturn = ['article'];

  // 残す属性
  let keepAttrs = ['alt', 'title', 'name', 'property', 'content', 'href'];

  // 不要物削除
  let removePatterns = [
    /\n/g,
    /\t/g,
    /<!--.*?-->/g,
    /<\?.*?>/g,
    // /<\/?(消す空要素|消す空要素).*?/ ?>/g
    new RegExp('<(' + removeEmptyTags.join('|') + ').*?\/?\s?>', 'g'),
    // /<(消す最小要素|消す最小要素).*?</.*?>/g
    new RegExp('<(' + removeElements.join('|') + ').*?<\/.*?>', 'g'),
    // /<\/?(消すタグ|消すタグ).*?>/g
    new RegExp('<\/?\s?(' + removeTags.join('|') + ').*?>', 'g'),
    // /[\w-]*(?<!残す属性達)(?<!残す属性達)=".*?"/g
    new RegExp('[\\w-]*(?<! ' + keepAttrs.join(')(?<! ') + ')=".*?"', 'g'),
  ];

  // 個別整形
  let replacePatterns = [
    [/> +</g, '><'],
    [/ +/g, ' '],
    [/ >/g, '>'],
    [/ </g, '<'],
    [/> /g, '>']
  ];
  // 改行整形
  let addReturnPatterns = [
    // 先頭以外で \nの直後ではない <の直前 を改行
    [/(?<!^)(?<!\n)(?=<)/g, '\n'],
    // 末尾以外で \nの直前ではない >の直後 を改行
    [/(?<=>)(?!\n)(?!$)/g, '\n'],
    // exceptReturn開始タグ直後で cancel開始タグ直後ではない \n を削除
    [new RegExp(
      '(?<=<(' + exceptReturn.join('|') + ').*?>)'
      + '(?<!<' + cancelExceptReturn.join('.*?>)(?<!<') + '.*?>)'
      + '\\n',
      'g'), ''],
    // exceptReturn閉じタグ直前で cancel閉じタグ直前ではない \n を削除
    [new RegExp(
      '\\n'
      + '(?=<\/\s?(' + exceptReturn.join('|') + ').*?>)'
      + '(?!<\/\s?' + cancelExceptReturn.join('.*?>)(?!<\/\s?') + '.*?>)',
      'g'), ''],
    // <br>直前の \n を削除
    [/\n(?=<br>)/g, ''],
  ];

  // outputHTML()
  function outputHTML() {
    let input = pasteBox.value;
    let output = formatHTML(input);
    outputBox.value = output;
    previewBox.innerHTML = output;
  }

  // formatHTML(string)
  function formatHTML(input) {
    removePatterns.forEach(val => input = input.replace(val, ''));
    replacePatterns.forEach(val => input = input.replace(val[0], val[1]));
    addReturnPatterns.forEach(val => input = input.replace(val[0], val[1]));
    input = makeIndent(input);
    return input;
  }

  // makeIndent(string)
  function makeIndent(input) {
    let lines = input.split('\n');
    const block = '  ';
    const headTag = new RegExp('^ *<\/');
    let indent = '';
    const indentproc = function(line) {
      // 現在のインデントを文頭に追加 現在の行が</>で始まっていたら一つ下げる
      line = indent + line;
      if (headTag.test(line)) {
        line = line.replace(block, '');
      }
      // 文字列中の開始タグと終了タグの個数と差をチェック match()がnullを返す場合のため(|| [])追加
      // 開始タグに空要素タグimg, metaを含まない
      const startTag = new RegExp('<(?!\/)(?!' + emptyTags.join(')(?!') + ')', 'g');
      const endTag = new RegExp('<\/', 'g');
      const startTagCount = (line.match(startTag) || []).length;
      const endTagCount = (line.match(endTag) || []).length;
      const change = startTagCount - endTagCount;
      // indent更新
      if (change < 0) {
        indent = indent.replace(block.repeat(Math.abs(change)), '');
      } else if (1 <= change) {
        indent += block.repeat(change);
      }
      return line;
    }
    lines = lines.map(line => indentproc(line));
    return lines.join('\n');
  }
}