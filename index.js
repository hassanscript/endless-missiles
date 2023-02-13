const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  autoCenter: true,
  parent: "root",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};

const game = new Phaser.Game(config);

let plane;
let clouds;
let missiles;
let blast;

let blastSound;
let scoreSound;

let cursors;

let startTime = 0;
let score = 0;
let scoreText;
let gameOver = true;
let missileGenerationRate = 1;

function preload() {
  this.load.image("sky", "assets/images/sky.png");
  this.load.image("plane", "assets/images/plane.png");
  this.load.image("cloud1", "assets/images/cloud1.png");
  this.load.image("cloud2", "assets/images/cloud2.png");
  this.load.image("cloud3", "assets/images/cloud3.png");
  this.load.image("cloud4", "assets/images/cloud4.png");
  this.load.spritesheet("missile", "assets/images/missile.png", {
    frameWidth: 100,
    frameHeight: 30,
  });
  this.load.spritesheet("blast", "assets/images/blast.png", {
    frameWidth: 192,
    frameHeight: 192,
  });
  this.load.audio("blast", [
    "assets/sound/blast.mp3",
    "assets/sound/blast.wav",
  ]);
  this.load.audio("score", [
    "assets/sound/score.mp3",
    "assets/sound/score.wav",
  ]);
}

function create() {
  blastSound = this.sound.add("blast");
  scoreSound = this.sound.add("score");

  this.add.image(400, 225, "sky");

  this.anims.create({
    key: "burn",
    frames: this.anims.generateFrameNumbers("missile", { start: 0, end: 4 }),
    frameRate: 10,
    repeat: -1,
  });
  this.anims.create({
    key: "blast",
    frames: this.anims.generateFrameNumbers("blast", { start: 0, end: 6 }),
    frameRate: 10,
    repeat: 0,
  });

  clouds = this.physics.add.group();

  missiles = this.physics.add.group();

  blast = this.physics.add.sprite(120, 225, "blast");
  blast.setScale(0.5);
  blast.visible = false;
  blast.depth = 300;

  plane = this.physics.add.image(120, 225, "plane");
  plane.depth = 200;
  plane.setSize(70, 30, true);
  plane.setCollideWorldBounds(true);

  scoreText = this.add.text(16, 16, "SCORE: 0", {
    fontSize: "22px",
    color: "white",
    stroke: "black",
    fontFamily: "Arial",
    strokeThickness: 5,
  });
  scoreText.depth = 400;
  overText1 = this.add.text(16, 16, "START GAME", {
    fontSize: "40px",
    color: "white",
    stroke: "black",
    fontFamily: "Arial",
    strokeThickness: 5,
  });
  overText1.setPosition(400 - overText1.width / 2, 200 - overText1.height / 2);
  overText1.depth = 400;
  overText2 = this.add.text(16, 16, "press RIGHT ARROW to start", {
    fontSize: "20px",
    color: "white",
    stroke: "black",
    fontFamily: "Arial",
    strokeThickness: 5,
  });
  overText2.setPosition(400 - overText2.width / 2, 250 - overText2.height / 2);
  overText2.depth = 400;
  if (!gameOver) {
    overText1.visible = false;
    overText2.visible = false;
  }
  cursors = this.input.keyboard.createCursorKeys();

  this.time.addEvent({
    callback: increaseMissileGenerationRate,
    callbackScope: this,
    delay: 10000,
    loop: true,
  });

  this.time.addEvent({
    callback: generateMissiles,
    callbackScope: this,
    delay: 1000,
    loop: true,
  });

  this.time.addEvent({
    callback: generateClouds,
    callbackScope: this,
    delay: 2000,
    loop: true,
  });

  this.physics.add.collider(plane, missiles, hitMissile, null, this);
}

function update() {
  if (!gameOver) {
    score = Math.floor((new Date() - startTime) / 100);
    scoreText.setText("SCORE: " + score);
    if (score % 100 == 0) scoreSound.play();
    movePlane();
    destroyOutOfBound();
  } else {
    startGame(this);
  }
}

function startGame(game) {
  if (cursors.right.isDown) {
    startTime = +new Date();
    score = +new Date();
    missileGenerationRate = 1;
    gameOver = false;
    game.scene.restart();
  }
}

function destroyOutOfBound() {
  clouds.getChildren().forEach((cloud) => {
    if (cloud.x < -100) cloud.destroy();
  });
  missiles.getChildren().forEach((missile) => {
    if (missile.x < -100) missile.destroy();
  });
}

function hitMissile() {
  blastSound.play();
  gameOver = true;
  this.physics.pause();
  missiles.getChildren().forEach((missile) => {
    missile.anims.pause();
  });
  blast.setPosition(plane.x, plane.y);
  blast.visible = true;
  blast.anims.play("blast");
  overText1.setText("GAME OVER!");
  overText1.visible = true;
  overText2.visible = true;
}

function generateClouds() {
  if (gameOver) return;
  const height = Math.floor(Math.random() * 450);
  const speed = Math.floor(Math.random() * (300 - 100)) + 100;
  const scale = Math.random() * (2 - 0.5) + 0.5;
  let cloudNumber = Math.floor(Math.random() * (5 - 1)) + 1;
  let cloud = clouds.create(850, height, "cloud" + cloudNumber);
  cloud.setVelocityX(-speed);
  cloud.setScale(scale);
  cloud.depth = 10;
}

function movePlane() {
  if (cursors.up.isDown) {
    plane.setVelocityY(-300);
    plane.angle = -20;
  } else if (cursors.down.isDown) {
    plane.setVelocityY(300);
    plane.angle = 20;
  } else {
    plane.setVelocityY(0);
    plane.angle = 0;
  }
}

function increaseMissileGenerationRate() {
  missileGenerationRate += 1;
}

function generateMissiles() {
  if (gameOver) return;
  for (let i = 0; i <= missileGenerationRate; i++) {
    const height = Math.floor(Math.random() * 450);
    let speed = Math.floor(Math.random() * (500 - 300)) + 300;
    speed += missileGenerationRate * 10;
    let missile = missiles.create(850, height, "missile");
    missile.setScale(0.7);
    missile.setVelocityX(-speed);
    missile.depth = 20;
    missile.anims.play("burn", true);
  }
}
