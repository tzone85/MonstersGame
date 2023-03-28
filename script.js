window.addEventListener('load', function () {
    const canvas = document.getElementById('canvas1');

    const ctx = canvas.getContext('2d');
    canvas.width = 1280;
    canvas.height = 720;

    // place here to avoid updating state with every draw
    ctx.fillStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'white';

    class Player {
        constructor(game) {
            this.game = game;
            this.collisionX = this.game.width * 0.5;
            this.collisionY = this.game.height * 0.5;
            this.collisionRadius = 30;

            this.speedX = 0;
            this.speedY = 0;

            this.dx = 0;
            this.dy = 0;
            this.speedModifier = 2;

            this.spriteWidth = 255;
            this.spriteHeight = 255;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.frameX = 0;
            this.frameY = 0;


            this.image = document.getElementById('bull');
        }

        draw(context) {
            context.drawImage(this.image, this.frameX * this.spriteWidth, this.frameY  * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.spriteX, this.spriteY, this.width, this.height)
            context.beginPath();
            context.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);
            context.save();
            context.globalAlpha = 0.5;
            context.fill();
            context.restore();
            context.stroke();

            context.beginPath();
            context.moveTo(this.collisionX, this.collisionY);
            context.lineTo(this.game.mouse.x, this.game.mouse.y);
            context.stroke();
        }

        update() {

            this.dx = this.game.mouse.x - this.collisionX;
            this.dy = this.game.mouse.y - this.collisionY;

            // sprite animation
            const angle = Math.atan2(this.dy, this.dx);

            // make player always face mouse
            if (angle < -2.74 || angle > 274) this.frameY = 6;
            else if (angle < -1.96) this.frameY = 7;
            else if (angle < -1.17) this.frameY = 0;
            else if (angle < -0.39) this.frameY = 1;
            else if (angle < 0.39) this.frameY = 2;
            else if (angle < 1.17) this.frameY = 3;
            else if (angle < 1.96) this.frameY = 4;
            else if (angle < 2.74) this.frameY = 5;



            const distance = Math.hypot(this.dy, this.dx);

            // move only when dist > speedModifier
            if (distance > this.speedModifier) {
                this.speedX = this.dx / distance || 0;
                this.speedY = this.dy / distance || 0;
            } else {
                this.speedX = 0;
                this.speedY = 0;
            }

            this.collisionX += this.speedX * this.speedModifier;
            this.collisionY += this.speedY * this.speedModifier;

            this.spriteX = this.collisionX - this.width * 0.5;
            this.spriteY = this.collisionY - this.height * 0.5 - 100;

            // does collision occur
            // only able to check objects with collision x and y defined within the constructor
            // [(distance < sumRadii), distance, sumRadii, dx, dy];
            this.game.obstacle.forEach(obstacle => {
                let [collision, distance, sumRadii, dx, dy] = this.game.checkCollision(this, obstacle);

                if (collision) {
                    // horizontal and vertical vectors defined
                    const unit_x = dx / distance;
                    const unit_y = dy / distance;

                    this.collisionX = obstacle.collisionX + (sumRadii + 1 ) * unit_x;
                    this.collisionY = obstacle.collisionY + (sumRadii + 1) * unit_y;
                }

            })
        }
    }

    class Obstacle {
        constructor(game) {
            this.game = game;

            this.collisionX = Math.random() * this.game.width;
            this.collisionY = Math.random() * this.game.height;
            this.collisionRadius = 55;

            // obstacled to be randomly scattered
            this.image = document.getElementById('obstacles');
            this.spriteWidth = 250;
            this.spriteHeight = 250;

            this.width = this.spriteWidth;
            this.height = this.spriteHeight;

            this.spriteX = this.collisionX - this.width * 0.5;
            this.spriteY = this.collisionY - this.height * 0.5 - 70;

            // which column on the sprite sheet
            this.frameX = Math.floor(Math.random() * 4);

            // which row on the sprite sheet
            this.frameY = Math.floor(Math.random() * 3);
        }

        draw(context) {

            context.drawImage(document.getElementById('obstacles'), this.frameX * this.spriteWidth , this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.spriteX, this.spriteY, this.width, this.height);
            context.beginPath();
            context.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);
            context.save();
            context.globalAlpha = 0.5;
            context.fill();
            context.restore();
            context.stroke();

        }
    }

    class Game {
        constructor(canvas) {
            this.canvas = canvas;
            this.width = this.canvas.width;
            this.height = this.canvas.height;

            this.topMargin = 260;
            this.player = new Player(this);

            this.numberOfObstacles = 4;
            this.obstacle = [];

            this.mouse = {
                x: this.width * 0.5,
                y: this.height * 0.5,
                pressed: false
            }

            // event listeners
            canvas.addEventListener('mousedown', (evt) => {
                this.mouse.x = evt.offsetX;
                this.mouse.y = evt.offsetY
                this.mouse.pressed = true;
            });

            canvas.addEventListener('mouseup', (evt) => {
                this.mouse.x = evt.offsetX;
                this.mouse.y = evt.offsetY;
                this.mouse.pressed = false;
            });

            canvas.addEventListener('mousemove', (evt) => {
                if (this.mouse.pressed) {
                    this.mouse.x = evt.offsetX;
                    this.mouse.y = evt.offsetY;
                }
            });
        }

        render(context) {
                this.obstacle.forEach(obstacle => obstacle.draw(context));
                this.player.draw(context);
                this.player.update();
        }

        checkCollision(a, b) {
            const dx = a.collisionX - b.collisionX;
            const dy = a.collisionY - b.collisionY;

            const distance = Math.hypot(dy, dx);

            // determine if collision took place using the two radii of the circles
            const sumRadii = a.collisionRadius + b.collisionRadius;

            // return if collision is happening with custom values that we added
             return [(distance < sumRadii), distance, sumRadii, dx, dy];
        }
            init()
            {
                 // circle packing
                let aattempts = 0;

                while (this.obstacle.length < this.numberOfObstacles && aattempts < 500) {

                    let testObstacle = new Obstacle(this);
                    // console.log(testObstacle);

                    let overlap = false;

                    this.obstacle.forEach(obstacle => {
                        const dx = testObstacle.collisionX - obstacle.collisionX;
                        const dy = testObstacle.collisionY - obstacle.collisionY;

                        const distance = Math.hypot(dy, dx);
                        const distanceBuffer = 145;                                     // obstacle spacing
                        const sumOfRadii = testObstacle.collisionRadius + obstacle.collisionRadius + distanceBuffer;

                        if (distance < sumOfRadii) {
                             overlap = true;
                        }
                    });
                    const margin = testObstacle.collisionRadius * 2;
                    if (!overlap && testObstacle.spriteX > 0 && testObstacle.spriteX < this.width - testObstacle.width && testObstacle.collisionY > this.topMargin + margin && testObstacle.collisionY < this.height - margin) {
                        this.obstacle.push(testObstacle);
                    }
                    aattempts++;
                }
            }

        }



    const game = new Game(canvas);
    game.init();
    console.log(game);

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        game.render(ctx);
        requestAnimationFrame(animate);

    }

    animate();
});

