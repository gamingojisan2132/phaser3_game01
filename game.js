const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 400,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 1000 } }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

let player;
let keys;
let ground;
let obstacles;
let score = 0;
let scoreText;
let highScore = localStorage.getItem('highScore') || 0;
let jumpSound;
let hitSound;
let bgm;

function preload() {
  console.log("Preload is running!");
  this.load.image('obstacle', 'assets/obstacle.png');
  this.load.image('background', 'assets/background.png');
  this.load.image('ground', 'assets/ground.png');
  this.load.spritesheet('player', 'assets/player-sprite.png', { frameWidth: 50, frameHeight: 50 });
  this.load.audio('jump', 'assets/jump.mp3');
  this.load.audio('hit', 'assets/hit.mp3');
  this.load.audio('bgm', 'assets/bgm.mp3');
}

function create() {
  console.log("Create is running!");
  // 背景を追加
  this.add.image(300, 200, 'background').setDisplaySize(600, 400);

  // 地面を追加
  ground = this.add.image(300, 390, 'ground').setDisplaySize(600, 20);
  this.physics.add.existing(ground);
  ground.body.setImmovable(true);
  ground.body.allowGravity = false;

  // プレイヤーを追加
  player = this.physics.add.sprite(100, 200, 'player');
  player.setDisplaySize(50, 50);
  player.body.setCollideWorldBounds(true);
  this.physics.add.collider(player, ground);

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
  player.play('run');
  console.log("Player animation set to 'run'");

  // スペースキーの入力設定
  keys = this.input.keyboard.addKeys({
    jump: Phaser.Input.Keyboard.KeyCodes.SPACE
  });

  keys.jump.on('down', () => {
    console.log("Space key pressed!");
  });

  // 障害物グループを作成
  obstacles = this.physics.add.group();
  this.physics.add.collider(player, obstacles, gameOver, null, this);
  this.physics.add.collider(obstacles, ground);

  // スコア表示
  scoreText = this.add.text(20, 20, 'Score: 0', { fontFamily: 'CustomFont', fontSize: '24px', color: '#ffffff', backgroundColor: '#000000' });
  scoreText.setDepth(1);

  // サウンドを設定
  jumpSound = this.sound.add('jump');
  hitSound = this.sound.add('hit');
  bgm = this.sound.add('bgm', { loop: true });
  bgm.play();

  // 障害物を定期的に生成
  this.time.addEvent({
    delay: 1200,
    callback: spawnObstacle,
    callbackScope: this,
    loop: true
  });
}

function spawnObstacle() {
  console.log("Spawning obstacle!");
  const size = Phaser.Math.Between(15, 35);
  const obstacle = this.physics.add.sprite(600, 380 - size / 2, 'obstacle');
  obstacle.setDisplaySize(size, size);
  obstacles.add(obstacle);
  obstacle.body.setVelocityX(-400);
  obstacle.body.allowGravity = false;
  obstacle.body.setImmovable(false);
}

function gameOver(player, obstacle) {
  console.log("Game Over! Final Score: " + score);
  this.physics.pause();

  hitSound.play();
  bgm.stop();

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
  }

  this.add.text(300, 150, 'Game Over', { fontFamily: 'CustomFont', fontSize: '32px', color: '#ff0000', align: 'center' }).setOrigin(0.5);
  this.add.text(300, 200, 'Final Score: ' + score, { fontFamily: 'CustomFont', fontSize: '24px', color: '#ff0000', align: 'center' }).setOrigin(0.5);
  this.add.text(300, 230, 'High Score: ' + highScore, { fontFamily: 'CustomFont', fontSize: '24px', color: '#ff0000', align: 'center' }).setOrigin(0.5);

  const restartButton = this.add.text(300, 280, 'Restart', { fontFamily: 'CustomFont', fontSize: '24px', color: '#ffffff', backgroundColor: '#fca600', padding: { x: 10, y: 5 } }).setOrigin(0.5);
  restartButton.setInteractive();
  restartButton.on('pointerdown', () => {
    score = 0;
    scoreText.setText('Score: ' + score);
    this.scene.restart();
  });

  keys.jump.removeAllListeners();
  keys.jump.on('down', () => {
    score = 0;
    scoreText.setText('Score: ' + score);
    this.scene.restart();
  }, this);
}

function update() {
  if (keys.jump.isDown && player.body.touching.down) {
    console.log("Jump triggered!");
    player.body.setVelocityY(-300);
    jumpSound.play();
    player.play('jump');
  } else if (player.body.touching.down) {
    if (player.anims.currentAnim.key !== 'run') {
      console.log("Playing run animation");
      player.play('run');
    }
  } else {
    player.play('jump');
  }

  obstacles.getChildren().forEach(obstacle => {
    if (obstacle.x < player.x && !obstacle.scored) {
      score += 1;
      obstacle.scored = true;
      scoreText.setText('Score: ' + score);
    }
    if (obstacle.x < -20) {
      obstacle.destroy();
    }
  });
}