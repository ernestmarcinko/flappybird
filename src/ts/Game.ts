import { Layer } from "./Layer";
import { Bird } from "./Bird";
import { Input } from "./Input"; 
import { Pipe } from "./Pipe";
import { Score } from "./Score";
import { BirdPlayer } from "./BirdPlayer";
import Sprite from "./../../images/sprite.png";
import { Population } from "./Population";

enum GameType {
    player = "player",
    ai = "ai",
    training = "training"
}


export class Game {
    width: number = 144; // Game Canvas width
    height: number = 256; // Game Canvas height
    scale: number = 2; // Scale (zoom) for width/height
    gravity: number = 0.0008; // relative to the canvas height pull
    started: boolean = false;
    ended: boolean = false;
    startTime: number = 0;
    speed: number = 2;
    score: number = 0;
    canvas: HTMLCanvasElement;
    sprite: CanvasImageSource;
    ctx: CanvasRenderingContext2D|null;
    pipes: Array<Pipe>;
    gameType: GameType = GameType.training;

    private bird: Bird | BirdPlayer;
    private population: Population;
    private input: Input;
    private bgLayer: Layer;
    private bottomLayer: Layer;
    private scoreObj: Score;

    /**
     * Ok, I don't like to multiply by deltaTime, sue me.
     * Instead I expect a 60 framerate and adjust the frames by
     * the actual framerate and expected framerate ratio.
     * It's the same as deltaTime, but you get a lower number.
     */
    private expectedFPS: number = 60;
    private expectedFrameTime: number = 1000/this.expectedFPS;

    constructor( canvas: HTMLCanvasElement ) {
        const image = new Image(); // Create new img element
        image.src = Sprite;
        this.sprite = image as CanvasImageSource;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        canvas.width = this.width * this.scale;
        canvas.height = this.height * this.scale;

        this.input = new Input();

        // Background
        this.bgLayer = new Layer({
            ctx: this.ctx,
            image: this.sprite,
            x: 0, y: 0, sx: 0, sy: 0, 
            width: this.width, 
            height: this.height, 
            scale: this.scale,
            speed: 0.05
        });

        this.pipes = [
            new Pipe(this, this.sprite, this.scale, this.speed, 1),
            new Pipe(this, this.sprite, this.scale, this.speed, 1.5)
        ];

        // Bottom
        this.bottomLayer = new Layer({
            ctx: this.ctx,
            image: this.sprite,
            x: 0, y: (this.height - 56)* this.scale, sx: 292, sy: 0, 
            width: 144, height: 56, 
            scale: this.scale,
            speed: this.speed
        });

        if ( this.gameType == GameType.player ) {
            // Bird
            this.bird = new Bird(this);
        } else if ( this.gameType == GameType.ai ) {
            this.bird = new BirdPlayer(this, {
                jumpFrequency: 150,
                distances: {
                    x: 150,
                    top: 50,
                    bottom: 60,
                    jumpHeight: 90
                }
            });
        } else if ( this.gameType == GameType.training ) {
            this.population = new Population(this, 50);
        }

        // Score
        this.scoreObj = new Score(this, this.sprite, this.scale);
    }

    update(deltaTime: number): void {
        // If the FPS is not 60 then the calculations need to be adjusted
        const frameAdjustment = deltaTime / this.expectedFrameTime;

        if ( this.gameType == GameType.player ) {
            if ( !this.started && this.input.didClick() ) {
                this.started = true;
                this.startTime = Date.now();
                this.bird.jump();
            }
            if ( !this.ended && !this.bird.collided() ) {
                if ( this.started ) {
                    this.bgLayer.update(frameAdjustment);
                    this.bottomLayer.update(frameAdjustment);
                }
                this.bird.update(frameAdjustment, deltaTime, this.input);
                if ( this.started ) {
                    for ( const pipe of this.pipes ) {
                        pipe.update(frameAdjustment);
                    }
                }
                this.score = this.bird.score;
            } else if ( !this.ended ) {
                this.ended = true;
                // This is useful for testing at different framerates
                console.log('Game Time: ', (Date.now() - this.startTime)/1000, 's');
            }
        } else if ( this.gameType == GameType.ai ) {
            if ( !this.started ) {
                this.started = true;
                this.startTime = Date.now();
                this.bird.jump();
            }
            if ( !this.ended && !this.bird.collided() ) {
                if ( this.started ) {
                    this.bgLayer.update(frameAdjustment);
                    this.bottomLayer.update(frameAdjustment);
                }
                this.bird.update(frameAdjustment, deltaTime, this.input);
                if ( this.started ) {
                    for ( const pipe of this.pipes ) {
                        pipe.update(frameAdjustment);
                    }
                }
                this.score = this.bird.score;
            } else if ( !this.ended ) {
                this.ended = true;
                // This is useful for testing at different framerates
                console.log('Game Time: ', (Date.now() - this.startTime)/1000, 's');
            }
        } else if ( this.gameType == GameType.training ) {
            if ( !this.started ) {
                this.started = true;
                this.startTime = Date.now();
                this.population.jump();
            }
            if ( !this.ended ) {
                if ( this.started ) {
                    this.bgLayer.update(frameAdjustment);
                    this.bottomLayer.update(frameAdjustment);
                }
                this.population.update(frameAdjustment, deltaTime);
                if ( this.started ) {
                    for ( const pipe of this.pipes ) {
                        pipe.update(frameAdjustment);
                    }
                }
            } else if ( !this.ended ) {
                this.ended = true;
                // This is useful for testing at different framerates
                console.log('Game Time: ', (Date.now() - this.startTime)/1000, 's');
            }
        }


    }

    draw(): void {
        this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.bgLayer.draw();
        for ( const pipe of this.pipes ) {
            pipe.draw();
        }
        this.bottomLayer.draw();
        if ( this.gameType == GameType.training ) {
            this.population.draw();
        } else {
            this.bird.draw();
            this.scoreObj.draw();
        }
    }
}