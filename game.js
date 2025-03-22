const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 400,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 500 } }
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

function preload() {
  console.log("Preload is running!");
  // 画像を読み込み
  this.load.image('player', 'assets/player.png'); // プレイヤー画像
  this.load.image('obstacle', 'assets/obstacle.png'); // 障害物画像
  this.load.image('background', 'assets/background.png'); // 背景画像
  this.load.image('ground', 'assets/ground.png'); // 地面画像
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
  player.setDisplaySize(50, 50); // 画像サイズを調整
  player.body.setCollideWorldBounds(true);
  this.physics.add.collider(player, ground);

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
  scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', color: '#ffffff', backgroundColor: '#000000' });
  scoreText.setDepth(1);

  // 障害物を定期的に生成
  this.time.addEvent({
    delay: 2000,
    callback: spawnObstacle,
    callbackScope: this,
    loop: true
  });
}

function spawnObstacle() {
  console.log("Spawning obstacle!");
  const obstacle = this.physics.add.sprite(600, 370, 'obstacle');
  obstacle.setDisplaySize(20, 20); // 画像サイズを調整
  obstacles.add(obstacle);
  obstacle.body.setVelocityX(-200);
  obstacle.body.allowGravity = false;
  obstacle.body.setImmovable(false);
}

function gameOver(player, obstacle) {
  console.log("Game Over! Final Score: " + score);
  this.physics.pause();
  this.add.text(300, 200, 'Game Over\nFinal Score: ' + score, { fontSize: '32px', color: '#ff0000', align: 'center' }).setOrigin(0.5);
  this.time.delayedCall(2000, () => {
    score = 0;
    scoreText.setText('Score: ' + score);
    this.scene.restart();
  });
}

function update() {
  if (keys.jump.isDown && player.body.touching.down) {
    console.log("Jump triggered!");
    player.body.setVelocityY(-300);
  }

  // 障害物がプレイヤーを通過したらスコア加算
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