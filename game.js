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

    // ダミーテキストでフォントを強制的に読み込む（非表示）
    this.add.text(-100, -100, 'Dummy', { fontFamily: 'CustomFont', fontSize: '1px' });

    // タイトルテキスト（フォント適用）
    this.add.text(300, 150, 'Inu desu', { fontFamily: 'CustomFont', fontSize: '48px', color: '#ffffff', align: 'center' }).setOrigin(0.5);

    // 開始指示テキスト（フォント適用）
    this.add.text(300, 250, 'Press SPACE to Start', { fontFamily: 'CustomFont', fontSize: '24px', color: '#ffffff', align: 'center' }).setOrigin(0.5);

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
    this.load.image('ground', 'assets/ground.png');
    this.load.spritesheet('player', 'assets/player-sprite.png', { frameWidth: 50, frameHeight: 50 });
    this.load.audio('jump', 'assets/jump.mp3');
    this.load.audio('hit', 'assets/hit.mp3');
    this.load.audio('bgm', 'assets/bgm.mp3');
  }

  create() {
    console.log("Create is running!");
    // 背景を追加
    this.add.image(300, 200, 'background').setDisplaySize(600, 400);

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

    // スペースキーの入力設定
    this.keys = this.input.keyboard.addKeys({
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    this.keys.jump.on('down', () => {
      console.log("Space key pressed!");
    });

    // 障害物グループを作成
    this.obstacles = this.physics.add.group();
    this.physics.add.collider(this.player, this.obstacles, this.gameOver, null, this);
    this.physics.add.collider(this.obstacles, this.ground);

    // スコア表示
    this.score = 0;
    this.scoreText = this.add.text(20, 20, 'Score: 0', { fontFamily: 'CustomFont', fontSize: '24px', color: '#ffffff', backgroundColor: '#000000' });
    this.scoreText.setDepth(1);

    // サウンドを設定
    this.jumpSound = this.sound.add('jump');
    this.hitSound = this.sound.add('hit');
    this.bgm = this.sound.add('bgm', { loop: true });
    this.bgm.play();

    // 障害物を定期的に生成
    this.time.addEvent({
      delay: 1200,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    });
  }

  spawnObstacle() {
    console.log("Spawning obstacle!");
    const size = Phaser.Math.Between(15, 35);
    const obstacle = this.physics.add.sprite(600, 380 - size / 2, 'obstacle');
    obstacle.setDisplaySize(size, size);
    this.obstacles.add(obstacle);
    obstacle.body.setVelocityX(-400);
    obstacle.body.allowGravity = false;
    obstacle.body.setImmovable(false);
  }

  gameOver(player, obstacle) {
    console.log("Game Over! Final Score: " + this.score);
    this.physics.pause();

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
    if (this.keys.jump.isDown && this.player.body.touching.down) {
      console.log("Jump triggered!");
      this.player.body.setVelocityY(-300);
      this.jumpSound.play();
      this.player.play('jump');
    } else if (this.player.body.touching.down) {
      if (this.player.anims.currentAnim.key !== 'run') {
        console.log("Playing run animation");
        this.player.play('run');
      }
    } else {
      this.player.play('jump');
    }

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

// グローバル変数（GameSceneで使用）
GameScene.prototype.highScore = localStorage.getItem('highScore') || 0;