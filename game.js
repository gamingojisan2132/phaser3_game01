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

function preload() {
  console.log("Preload is running!");
}

function create() {
  console.log("Create is running!");
  // 地面（赤い床）を追加
  ground = this.add.rectangle(300, 390, 600, 20, 0xff0000);
  this.physics.add.existing(ground);
  ground.body.setImmovable(true);
  ground.body.allowGravity = false;

  // プレイヤー（青い四角形）を追加
  player = this.physics.add.existing(
    this.add.rectangle(100, 200, 50, 50, 0x0000ff)
  );
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
  const obstacle = this.add.rectangle(600, 370, 20, 20, 0x00ff00); // Y座標を370に変更
  this.physics.add.existing(obstacle);
  obstacles.add(obstacle);
  obstacle.body.setVelocityX(-200);
  obstacle.body.allowGravity = false;
  obstacle.body.setImmovable(false);
}

function gameOver(player, obstacle) {
  console.log("Game Over!");
  this.physics.pause();
  // Game Overテキストを表示
  this.add.text(300, 200, 'Game Over', { fontSize: '32px', color: '#ff0000' }).setOrigin(0.5);
  this.time.delayedCall(2000, () => {
    this.scene.restart();
  });
}

function update() {
  if (keys.jump.isDown && player.body.touching.down) {
    console.log("Jump triggered!");
    player.body.setVelocityY(-300);
  }

  // 障害物が画面外に出たら削除
  obstacles.getChildren().forEach(obstacle => {
    if (obstacle.x < -20) {
      obstacle.destroy();
    }
  });
}