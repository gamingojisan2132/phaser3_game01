// タイトル画面シーン
class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload() {
    this.load.image('title-background', 'assets/title-background.png');
  }

  create() {
    // 背景を追加
    this.add.image(300, 200, 'title-background').setDisplaySize(600, 400);

    // フォントが利用可能になるまで待つ
    document.fonts.load('1px CustomFont').then(() => {
      // ダミーテキストでフォントを強制的に読み込む（非表示）
      this.add.text(-100, -100, 'Dummy', { fontFamily: 'CustomFont', fontSize: '1px' });

      // タイトルテキスト（フォント適用）
      this.add.text(300, 150, 'Inu desu', { fontFamily: 'CustomFont', fontSize: '48px', color: '#ffffff', align: 'center' }).setOrigin(0.5);

      // 開始指示テキスト（フォント適用）
      this.add.text(300, 250, 'Press SPACE to Start', { fontFamily: 'CustomFont', fontSize: '24px', color: '#ffffff', align: 'center' }).setOrigin(0.5);
    });

    // スペースキーの入力設定
    this.input.keyboard.on('keydown-SPACE', () => {
      this.scene.start('GameScene'); // ゲームシーンに遷移
    });
  }
}

// ゲームシーン（現在のゲームロジック）
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    console.log("Preload is running!");
    this.load.image('obstacle', 'assets/obstacle.png');
    this.load.image('background', 'assets/background.png');
    this.load.image('midground', 'assets/midground.png'); // 中景の読み込み
    this.load.image('ground', 'assets/ground.png');
    this.load.image('particle', 'assets/particle.png'); // パーティクル用画像
    this.load.image('bonus', 'assets/bonus.png'); // ボーナスアイテム画像
    this.load.spritesheet('player', 'assets/player-sprite.png', { frameWidth: 50, frameHeight: 50 });
    this.load.audio('jump', 'assets/jump.mp3');
    this.load.audio('double-jump', 'assets/double-jump.mp3');
    this.load.audio('hit', 'assets/hit.mp3');
    this.load.audio('bgm', 'assets/bgm.mp3');
    this.load.audio('kira', 'assets/kira.mp3'); // ボーナス取得時の効果音
  }

  create() {
    console.log("Create is running!");
    // 背景を追加
    this.add.image(300, 200, 'background').setDisplaySize(600, 400);

// 中景をスクロールさせるために複数枚追加（タイル状に繋げる）
  this.midgrounds = [];
  for (let i = 0; i < 3; i++) {
    const midground = this.add.image(300 + (i * 600), 200, 'midground').setDisplaySize(600, 400);
    this.midgrounds.push(midground);
  }
  // 中景のスクロール速度の基本値
  this.midgroundScrollSpeed = -2;

  // 地面を追加
    this.ground = this.add.image(300, 390, 'ground').setDisplaySize(600, 20);
    this.physics.add.existing(this.ground);
    this.ground.body.setImmovable(true);
    this.ground.body.allowGravity = false;

    // プレイヤーを追加
    this.player = this.physics.add.sprite(100, 350, 'player');
    this.player.setDisplaySize(50, 50);
    this.player.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.ground);

    // プレイヤーのアニメーションを定義
    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
      frameRate: 16,
      repeat: -1
    });
    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNumbers('player', { start: 2, end: 2 }),
      frameRate: 1,
      repeat: 0
    });
    this.anims.create({
      key: 'land',
      frames: this.anims.generateFrameNumbers('player', { start: 3, end: 3 }),
      frameRate: 1,
      repeat: 0
    });
    this.player.play('run');
    console.log("Player animation set to 'run'");

    // パーティクルエミッターを作成（円形に等間隔で配置する設定）
    this.doubleJumpEmitter = this.add.particles('particle').createEmitter({
      speed: 200, // 速度
      lifespan: 400, // 寿命
      scale: { start: 1, end: 1 }, // スケール
      alpha: { start: 1, end: 1 }, // 透明度
      radial: true, // 円形に拡散
      rotate: { min: 0, max: 0 }, // 回転
      blendMode: 'ADD', // 光の加算効果
      on: false // 初期状態ではオフ
    });

    // スペースキーの入力設定
    this.keys = this.input.keyboard.addKeys({
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    // ジャンプ処理（keydownイベントで検出）
    this.keys.jump.on('down', () => {
      if (this.player.body.touching.down) {
        // 地面にいる場合：1回目のジャンプ
        this.player.body.setVelocityY(-300);
        this.jumpCount = 1;
        this.jumpSound.play();
        this.player.play('jump');
        console.log("First jump!");
      } else if (this.jumpCount === 1) {
        // 空中で2回目のジャンプ（二段ジャンプ）
        this.player.body.setVelocityY(-300);
        this.jumpCount = 2;
        this.doubleJumpSound.play();
        this.player.play('jump');
        // スコアを2倍に
        this.score *= 2;
        this.scoreText.setText('Score: ' + this.score);
        console.log("Double jump! Score doubled to: " + this.score);

        // パーティクルエフェクトをプレイヤーの位置で発動（等間隔で配置）
        this.doubleJumpEmitter.setPosition(this.player.x, this.player.y);
        const particleCount = 7; // パーティクル数
        const angleStep = 360 / particleCount; // 360度を均等に分割
        for (let i = 0; i < particleCount; i++) {
          const angle = i * angleStep; // 等間隔の角度
          this.doubleJumpEmitter.setAngle(angle); // 角度を設定
          this.doubleJumpEmitter.emitParticle(1); // 1個ずつパーティクルを生成
        }
      }
    });

    // 障害物グループを作成
    this.obstacles = this.physics.add.group();
    this.physics.add.collider(this.player, this.obstacles, this.gameOver, null, this);
    this.physics.add.collider(this.obstacles, this.ground);

    // ボーナスアイテムグループを作成
    this.bonuses = this.physics.add.group();
    this.physics.add.overlap(this.player, this.bonuses, this.collectBonus, null, this);    this.physics.add.collider(this.bonuses, this.ground);

    // スコア表示
    this.score = 0;
    this.scoreText = this.add.text(20, 20, 'Score: 0', { fontFamily: 'CustomFont', fontSize: '24px', color: '#ffffff', backgroundColor: '#000000' });

    // サウンドを設定
    this.jumpSound = this.sound.add('jump');
    this.doubleJumpSound = this.sound.add('double-jump');
    this.hitSound = this.sound.add('hit');
    this.bgm = this.sound.add('bgm', { loop: true });
    this.kiraSound = this.sound.add('kira'); // ボーナス取得時の効果音
    this.bgm.play();

    // 難易度管理
    this.difficultyLevel = 0;
    this.baseDelay = 1200;
    this.baseSpeed = -400;
    this.currentDelay = this.baseDelay;

    // ジャンプ回数の管理
    this.jumpCount = 0;

    // 障害物とボーナスアイテムを定期的に生成
    this.spawnEvent = this.time.addEvent({
      delay: this.currentDelay,
      callback: this.spawnObstacleAndBonus,
      callbackScope: this,
      loop: true
    });
  }

spawnObstacleAndBonus() {
  // ボーナスアイテムを出現させるかどうかをランダムに決定（5%の確率）
  const spawnBonus = Phaser.Math.Between(1, 100) <= 5;
  
  // 速度の設定（障害物もボーナスも同じ速度設定を使用）
  const speedRange = 100 + (this.difficultyLevel * 50);
  const minSpeed = Math.max(-600, this.baseSpeed - speedRange);
  const maxSpeed = Math.min(-300, this.baseSpeed + speedRange);
  const randomSpeed = Phaser.Math.Between(minSpeed, maxSpeed);

  if (spawnBonus) {
    // ボーナスアイテムを生成
    console.log("Spawning bonus item!");
    const bonus = this.physics.add.sprite(600, 350, 'bonus'); // 少し高い位置に生成
    bonus.setDisplaySize(50, 50);
    this.bonuses.add(bonus);
    bonus.body.setVelocityX(randomSpeed);
    bonus.body.allowGravity = false;
    bonus.body.setImmovable(true);
    bonus.body.isSensor = true; // センサーとして設定（物理的な衝突を起こさない）
  } else {
    // 障害物を生成
    console.log("Spawning obstacle!");
    const size = Phaser.Math.Between(15, 35);
    const obstacle = this.physics.add.sprite(600, 380 - size / 2, 'obstacle');
    obstacle.setDisplaySize(size, size);
    this.obstacles.add(obstacle);
    obstacle.body.setVelocityX(randomSpeed);
    console.log(`Obstacle speed: ${randomSpeed}`);
    obstacle.body.allowGravity = false;
    obstacle.body.setImmovable(false);
  }
}
  collectBonus(player, bonus) {
    // ボーナスアイテムを取得
    console.log("Bonus collected!");
    this.bonuses.remove(bonus, true);
    bonus.destroy(); // アイテムを消す
    this.kiraSound.play(); // 効果音を再生

    // 現在の障害物の速度を半分に
    this.obstacles.getChildren().forEach(obstacle => {
      const currentSpeed = obstacle.body.velocity.x;
      obstacle.body.setVelocityX(currentSpeed / 2);
      console.log(`Obstacle speed reduced to: ${obstacle.body.velocity.x}`);
    });

    // 以降の障害物生成時の速度も半分に
    this.baseSpeed = this.baseSpeed / 2;
    console.log(`Base speed reduced to: ${this.baseSpeed}`);
  }

  adjustDifficulty() {
    const newDifficultyLevel = Math.floor(this.score / 10);
    if (newDifficultyLevel > this.difficultyLevel) {
      this.difficultyLevel = newDifficultyLevel;
      this.currentDelay = Math.max(800, this.baseDelay - (this.difficultyLevel * 100));
      console.log(`Difficulty increased! Delay: ${this.currentDelay}ms`);

      this.spawnEvent.remove();
      this.spawnEvent = this.time.addEvent({
        delay: this.currentDelay,
        callback: this.spawnObstacleAndBonus,
        callbackScope: this,
        loop: true
      });
    }
  }

  gameOver(player, obstacle) {
    console.log("Game Over! Final Score: " + this.score);
    this.physics.pause();

    // 障害物とボーナスアイテムの生成イベントを停止
    this.spawnEvent.remove();

    this.hitSound.play();
    this.bgm.stop();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('highScore', this.highScore);
    }

    this.add.text(300, 150, 'Game Over', { fontFamily: 'CustomFont', fontSize: '32px', color: '#ff0000', align: 'center' }).setOrigin(0.5);
    this.add.text(300, 200, 'Final Score: ' + this.score, { fontFamily: 'CustomFont', fontSize: '24px', color: '#ff0000', align: 'center' }).setOrigin(0.5);
    this.add.text(300, 230, 'High Score: ' + this.highScore, { fontFamily: 'CustomFont', fontSize: '24px', color: '#ff0000', align: 'center' }).setOrigin(0.5);

    const restartButton = this.add.text(300, 280, 'Restart', { fontFamily: 'CustomFont', fontSize: '24px', color: '#ffffff', backgroundColor: '#fca600', padding: { x: 10, y: 5 } }).setOrigin(0.5);
    restartButton.setInteractive();
    restartButton.on('pointerdown', () => {
      this.score = 0;
      this.scoreText.setText('Score: ' + this.score);
      this.scene.restart();
    });

    this.keys.jump.removeAllListeners();
    this.keys.jump.on('down', () => {
      this.score = 0;
      this.scoreText.setText('Score: ' + this.score);
      this.scene.restart();
    }, this);
  }

  update() {
    if (this.player.body.touching.down) {
      this.jumpCount = 0;
      if (this.player.anims.currentAnim.key !== 'run') {
        console.log("Playing run animation");
        this.player.play('run');
      }
    } else {
      this.player.play('jump');
    }

      // 中景のスクロール処理
  // 現在の障害物速度に基づいてスクロール速度を調整
  let currentObstacleSpeed = -400; // デフォルト値
  if (this.obstacles.getChildren().length > 0) {
    // 最初の障害物の速度を取得
    currentObstacleSpeed = this.obstacles.getChildren()[0].body.velocity.x;
  }
  
  // 障害物の速度に比例して中景のスクロール速度を設定（比率は調整可能）
  const speedRatio = 0.015; // この値を調整して中景スクロール速度を調整
  this.midgroundScrollSpeed = currentObstacleSpeed * speedRatio;
  
  // 中景をスクロール
  for (let i = 0; i < this.midgrounds.length; i++) {
    const midground = this.midgrounds[i];
    midground.x += this.midgroundScrollSpeed;
    
    // 画面外に出たら右端に戻す
    if (midground.x < -300) {
      // 最も右にある中景の右側に配置
      const rightmostX = Math.max(...this.midgrounds.map(mg => mg.x));
      midground.x = rightmostX + 600;
    }
  }


    
    // 障害物処理とスコア加算
    this.obstacles.getChildren().forEach(obstacle => {
      if (obstacle.x < this.player.x && !obstacle.scored) {
        this.score += 1;
        obstacle.scored = true;
        this.scoreText.setText('Score: ' + this.score);
      }
      if (obstacle.x < -20) {
        obstacle.destroy();
      }
    });

    // ボーナスアイテムが画面外に出たら削除
    this.bonuses.getChildren().forEach(bonus => {
      if (bonus.x < -20) {
        bonus.destroy();
      }
    });

    this.adjustDifficulty();
  }
}

// ゲーム設定
const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 400,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 1000 } }
  },
  scene: [TitleScene, GameScene]
};

const game = new Phaser.Game(config);

GameScene.prototype.highScore = localStorage.getItem('highScore') || 0;