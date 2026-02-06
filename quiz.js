// アルバムデータをロード
window.addEventListener('load', () => {
  if (typeof albums !== 'undefined') {
    console.log('アルバムデータ読み込み完了');
    initQuiz(); // データの存在を確認してから初期化
  } else {
    console.error('データが見つかりません');
  }
});

// グローバル変数
let foundSongs = new Set();
let totalSongs = 0;
let startTime = null;
let timerInterval = null;
let isStarted = false;
let currentMode = 'normal';
let targetCount = 0;
let timeLimit = 0;

// モード設定
const modeConfig = {
  normal: {title:'通常モード', desc:'全曲クリアを目指してタイムアタック!何分で全曲答えられるか挑戦しよう。'},
  time5: {title:'5分間チャレンジ', desc:'5分間で何曲思い出せるか挑戦!制限時間内にできるだけ多くの曲を答えよう。'},
  time10: {title:'10分間チャレンジ', desc:'10分間で何曲思い出せるか挑戦!じっくり考えて高得点を目指そう。'},
  songs100: {title:'100曲タイムアタック', desc:'100曲正解でゴール!どれだけ早くクリアできるかタイムアタック。'}
};

// 文字列正規化
function norm(s) {
  return s.toLowerCase()
    .replace(/[ぁ-ん]/g, c => String.fromCharCode(c.charCodeAt(0) + 96))
    .replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) - 65248))
    .replace(/[A-Za-z]/g, c => String.fromCharCode(c.charCodeAt(0) - 65248))
    .replace(/[\s\-_'!。、・☆]/g, '');
}

// モード選択
function selectMode(mode) {
  currentMode = mode;
  document.getElementById('overlayTitle').textContent = modeConfig[mode].title;
  document.getElementById('overlayDesc').textContent = modeConfig[mode].desc;
  document.getElementById('overlay').classList.add('active');
}

// オーバーレイを閉じる
function closeOverlay() {
  document.getElementById('overlay').classList.remove('active');
  document.getElementById('modeSelect').classList.add('hidden');
  document.getElementById('gameArea').classList.remove('hidden');
  initQuiz();
}

// モード選択に戻る
function backToModeSelect() {
  if (isStarted && !confirm('ゲームを中断してモード選択に戻りますか?')) return;
  resetQuiz();
  document.getElementById('gameArea').classList.add('hidden');
  document.getElementById('modeSelect').classList.remove('hidden');
}

// クイズ初期化
function initQuiz() {
  const container = document.getElementById('albumsContainer');
  container.innerHTML = '';
  totalSongs = 0;
  
  albums.forEach((album, ai) => {
    const albumDiv = document.createElement('div');
    albumDiv.className = 'album';
    
    const title = document.createElement('div');
    title.className = 'album-title';
    title.textContent = album.title;
    albumDiv.appendChild(title);
    
    const ul = document.createElement('ul');
    ul.className = 'song-list';
    
    album.songs.forEach((song, si) => {
      totalSongs++;
      const li = document.createElement('li');
      li.className = 'song-item';
      li.dataset.albumIndex = ai;
      li.dataset.songIndex = si;
      
      const num = document.createElement('span');
      num.className = 'song-number';
      num.textContent = `${si + 1}.`;
      
      const name = document.createElement('span');
      name.className = 'song-name';
      name.textContent = '???';
      
      li.appendChild(num);
      li.appendChild(name);
      ul.appendChild(li);
    });
    
    albumDiv.appendChild(ul);
    container.appendChild(albumDiv);
  });
  
  updateStats();

  
  displayAlbumGallery(); 


}

// クイズスタート
function startQuiz() {
  if (!isStarted) {
    isStarted = true;
    startTime = Date.now();
    
    if (currentMode === 'time5') timeLimit = 300000;
    else if (currentMode === 'time10') timeLimit = 600000;
    else timeLimit = 0;
    
    if (currentMode === 'songs100') targetCount = 100;
    else targetCount = 0;
    
    timerInterval = setInterval(updateTimer, 100);
    document.getElementById('songInput').focus();
    showMessage('スタート!頑張ってください!');
  }
}

// タイマー更新
function updateTimer() {
  if (!startTime) return;
  
  let elapsed = Date.now() - startTime;
  
  if (timeLimit > 0) {
    const remaining = timeLimit - elapsed;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      isStarted = false;
      showMessage(`⏰ 時間切れ!${foundSongs.size}曲正解!`);
      document.getElementById('songInput').disabled = true;
      return;
    }
    elapsed = remaining;
  }
  
  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);
  
  document.getElementById('timer').textContent = 
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 統計更新
function updateStats() {
  const found = foundSongs.size;
  const remaining = totalSongs - found;
  const progress = totalSongs > 0 ? Math.round((found / totalSongs) * 100) : 0;
  
  document.getElementById('foundCount').textContent = found;
  document.getElementById('remainingCount').textContent = remaining;
  document.getElementById('progressFill').style.width = progress + '%';
  document.getElementById('progressFill').textContent = progress + '%';
  

 displayAlbumGallery();


  if (targetCount > 0 && found >= targetCount) {
    clearInterval(timerInterval);
    showMessage(`🎉 ${targetCount}曲クリア!おめでとう! 🎉`);
    isStarted = false;
    document.getElementById('songInput').disabled = true;
  } else if (found === totalSongs && totalSongs > 0 && currentMode === 'normal') {
    clearInterval(timerInterval);
    showMessage('🎉 おめでとうございます!全曲クリア! 🎉');
  }
}

// メッセージ表示
function showMessage(text) {
  const msg = document.getElementById('message');
  msg.textContent = text;
  setTimeout(() => { msg.textContent = ''; }, 3000);
}

// 入力処理
document.getElementById('songInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && isStarted) {
    const input = norm(e.target.value);
    if (input.length < 1) return;
    
    const items = document.querySelectorAll('.song-item:not(.found)');
    let found = false;
    
    items.forEach(item => {
      const ai = parseInt(item.dataset.albumIndex);
      const si = parseInt(item.dataset.songIndex);
      const song = albums[ai].songs[si];
      const key = `${ai}-${si}`;
      
      if (!foundSongs.has(key)) {
        for (let reading of song.readings) {
          if (norm(reading) === input) {
            foundSongs.add(key);
            item.classList.add('found');
            item.querySelector('.song-name').textContent = song.name;
            updateStats();
            e.target.value = '';
            showMessage('正解!');
            found = true;
            return;
          }
        }
      }
    });
    
    if (!found) { e.target.value = ''; }
  }
});

// リセット
function resetQuiz() {
  foundSongs.clear();
  isStarted = false;
  startTime = null;
  clearInterval(timerInterval);
  document.getElementById('timer').textContent = '00:00:00';
  document.getElementById('songInput').value = '';
  document.getElementById('songInput').disabled = false;
  document.getElementById('message').textContent = '';
  initQuiz();
}

// ギブアップ
function giveUp() {
  if (!confirm('本当にギブアップしますか?全曲が表示されます。')) return;
  
  clearInterval(timerInterval);
  isStarted = false;
  
  const items = document.querySelectorAll('.song-item');
  items.forEach(item => {
    if (!item.classList.contains('found')) {
      const ai = parseInt(item.dataset.albumIndex);
      const si = parseInt(item.dataset.songIndex);
      item.querySelector('.song-name').textContent = albums[ai].songs[si].name;
      item.querySelector('.song-name').style.color = '#f44336';
    }
  });
  
  showMessage('お疲れ様でした!');
}

// アルバムギャラリーを表示
function displayAlbumGallery() {
  const gallery = document.getElementById('albumsGallery');
  if (!gallery) return;
  
  gallery.innerHTML = '';
  
  albums.forEach((album, index) => {
    const card = document.createElement('div');
    card.className = 'album-card-progress';
    
    // 達成度計算
    const totalSongs = album.songs.length;
    let completedSongs = 0;
    album.songs.forEach((song, si) => {
      const key = `${index}-${si}`;
      if (foundSongs.has(key)) completedSongs++;
    });
    const progress = totalSongs > 0 ? (completedSongs / totalSongs) * 100 : 0;
    
    // 完了チェック
    if (completedSongs === totalSongs && totalSongs > 0) {
      card.classList.add('complete');
    }
    
    // 画像
    const img = document.createElement('img');
    img.className = 'album-cover';
    img.src = album.image || 'images/default.jpg';
    img.alt = album.title;
    img.onerror = function() {
      this.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23ddd%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3E画像なし%3C/text%3E%3C/svg%3E';
    };
    card.appendChild(img);
    
    // カラー表示レイヤー
    const colorLayer = document.createElement('div');
    colorLayer.className = 'color-reveal-layer';
    colorLayer.style.backgroundImage = `url(${album.image || 'images/default.jpg'})`;
    colorLayer.style.clipPath = `inset(${100 - progress}% 0 0 0)`;
    card.appendChild(colorLayer);
    
    // 進捗バッジ
    const badge = document.createElement('div');
    badge.className = 'album-progress-badge';
    badge.textContent = `${completedSongs}/${totalSongs}`;
    card.appendChild(badge);
    
    // アルバム情報
    const info = document.createElement('div');
    info.className = 'album-card-info';
    info.textContent = album.title;
    card.appendChild(info);
    
    // 完了マーク
    const checkmark = document.createElement('div');
    checkmark.className = 'complete-checkmark';
    checkmark.textContent = '✓';
    card.appendChild(checkmark);
    
    gallery.appendChild(card);
  });
}