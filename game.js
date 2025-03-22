const config = {
    type: Phaser.AUTO,
    width: 600,  // 800 → 600
    height: 400, // 600 → 400
    parent: 'game-container',
    scene: {
      preload: preload,
      create: create
    }
  };
  
  const game = new Phaser.Game(config);
  
  function preload() {
    console.log("Preload is running!");
  }
  
  function create() {
    console.log("Create is running!");
    this.add.text(300, 200, 'Hello, Phaser!', { fontSize: '32px', color: '#ff0000' }).setOrigin(0.5);
  }