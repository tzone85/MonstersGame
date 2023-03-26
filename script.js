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
            this.speedModifier = 5;
        }

        draw(context) {
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
        }
    }

    class Obstacle {
        constructor(game) {
            this.game = game;

            this.collisionX = Math.random() * this.game.width;
            this.collisionY = Math.random() * this.game.height;
            this.collisionRadius = 75;

        }

        draw(context) {
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
            this.player = new Player(this);
            this.numberOfObstacles = 5;
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
                this.player.draw(context);
                this.player.update();
                this.obstacle.forEach(obstacle => obstacle.draw(context));
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
                        const sumOfRadii = testObstacle.collisionRadius + obstacle.collisionRadius;

                        if (distance < sumOfRadii) {
                             overlap = true;
                        }
                    });
                    if (!overlap) {
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

