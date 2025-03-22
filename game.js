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
let ground; // 地面をグローバル変数に

function preload() {
  console.log("Preload is running!");
}

function create() {
  console.log("Create is running!");
  // 地面（赤い床）を追加
  ground = this.add.rectangle(300, 390, 600, 20, 0xff0000); // Y座標を390に、色を赤に
  this.physics.add.existing(ground);
  ground.body.setImmovable(true); // 地面は動かない
  ground.body.allowGravity = false; // 地面に重力を無効化

  // プレイヤー（青い四角形）を追加
  player = this.physics.add.existing(
    this.add.rectangle(100, 200, 50, 50, 0x0000ff) // Y座標を200に変更
  );
  player.body.setCollideWorldBounds(true); // 画面外に出ないように

  // プレイヤーと地面の衝突を設定
  this.physics.add.collider(player, ground);

  // スペースキーの入力設定
  keys = this.input.keyboard.addKeys({
    jump: Phaser.Input.Keyboard.KeyCodes.SPACE
  });

  keys.jump.on('down', () => {
    console.log("Space key pressed!");
  });
}

function update() {
  console.log("Touching down:", player.body.touching.down); // デバッグ用
  if (keys.jump.isDown && player.body.touching.down) {
    console.log("Jump triggered!");
    player.body.setVelocityY(-300); // 1回だけジャンプ
  }
}