'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(objectVector) {
    if(!(objectVector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + objectVector.x, this.y + objectVector.y);
  }

  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}


class Actor {
  constructor(pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)) {
    if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
      throw new Error('Необходимо использовать объект типа Vector');
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  act() {

  }

  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return 'actor';
  }

  isIntersect(objectActor) {
    if(!(objectActor instanceof Actor) || !objectActor){
      throw new Error('Необходимо использовать объект типа Actor');
    }
    if(objectActor === this) {
      return false;
    }
    if (this.left >= objectActor.right) {
      return false;
    }
    if (this.right <= objectActor.left) {
      return false;
    }
    if (this.bottom <= objectActor.top) {
      return false;
    }
    if (this.top >= objectActor.bottom) {
      return false;
    }
    return true;
  }
}


class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = this.actors.find(actor => actor.type === 'player');
    this.height = this.grid.length;
    this.width = Math.max(0, ...this.grid.map(i => i.length));
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    if((this.status !== null) && (this.finishDelay < 0)) {
      return true;
    } else {
		return false;
	}
  }

  actorAt(movingActor) {
    if(!(movingActor instanceof Actor) || !movingActor) {
      throw new Error('Необходимо использовать объект типа Actor');
    }
    return this.actors.find(actor => movingActor.isIntersect(actor));
  }

  obstacleAt(pos, size) {
    if(!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Необходимо использовать объект типа Vector');
    }

    let leftWall = Math.floor(pos.x);
    let rightWall = Math.ceil(pos.x + size.x);
    let topWall = Math.floor(pos.y);
    let deadlyLava = Math.ceil(pos.y + size.y);

    if(leftWall < 0 || rightWall > this.width || topWall < 0) {
      return 'wall';
    }
    if(deadlyLava > this.height) {
      return 'lava';
    }
	
	for (let y = topWall; y < deadlyLava; y++) {
			for (let x = leftWall; x < rightWall; x++) {
				let obstacle = this.grid[y][x];
				if (typeof obstacle !== 'undefined') {
					return obstacle;
				}
			}
		}
	return undefined;
  }

  removeActor(actor) {
    if(this.actors.includes(actor)) {
      this.actors.splice(this.actors.indexOf(actor), 1);
    }
  }

  noMoreActors(type) {
    return this.actors.findIndex(actor => actor.type === type) === -1;
  }

  playerTouched(typeObject, movingActor) {
    if(this.status !== null) {
      return;
    }
    if(typeObject === 'lava' || typeObject === 'fireball') {
      this.status = 'lost';
      return;
    }
    if(typeObject === 'coin') {
      this.removeActor(movingActor);
      if(this.noMoreActors('coin')) {
        this.status = 'won';
        return;
      }
    }
  }
}


class LevelParser {
  constructor(listMovingActors) {
    this.listMovingActors = listMovingActors;
  }

  actorFromSymbol(symb) {
	if(typeof symb === 'undefined') {
		return undefined;
	}
	if(typeof this.listMovingActors === 'undefined'){
        return undefined;
	}
    return this.listMovingActors[symb];
  }

  obstacleFromSymbol(symb) {
    switch(symb) {
      case 'x': return 'wall';
      break;
      case '!': return 'lava';
      break;
      default: return undefined;
      break;
    }
  }

  createGrid(plan) {
    return plan.map(row => row.split('').map(elem => this.obstacleFromSymbol(elem)));
  }

  

  createActors(plan) {
    let listOfActors = [];
	
    plan.forEach((row, y) => {
      row.split('').forEach((symb, x) => {
        let createActor = this.actorFromSymbol(symb);
        if(typeof createActor === 'function') {
          let actor = new createActor(new Vector(x, y));
          if(actor instanceof Actor) {
            listOfActors.push(actor);
          }
        }
      });
    });
    return listOfActors;
  }

  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}

class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    let size = new Vector(1, 1);
    super(pos, size, speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    let nextPos = this.getNextPosition(time);
    if(level.obstacleAt(nextPos, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = nextPos;
    }
  }
}


class HorizontalFireball extends Fireball {
  constructor(pos) {
    let speed = new Vector(2, 0);
    super(pos, speed);
  }
}
  
class VerticalFireball extends Fireball {
  constructor(pos) {
    let speed = new Vector(0, 2);
    super(pos, speed);
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    let speed = new Vector(0, 3);
    super(pos, speed);
    this.startPos = this.pos;
  }

  handleObstacle() {
    this.pos = this.startPos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    let size = new Vector(0.6, 0.6);
    let position = pos.plus(new Vector(0.2, 0.1));
    super(position, size);
    this.pos = position;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1){
	this.updateSpring(time);
		const springVector = this.getSpringVector();
		return new Vector(this.pos.x,this.pos.y + springVector.y*time);
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}


class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    let size = new Vector(0.8, 1.5);
    let speed = new Vector(0, 0);
    pos = pos.plus(new Vector(0, -0.5));
    super(pos, size, speed);
  }

  get type() {
    return 'player';
  }
}


const schemas = [
  [
    '         ',
    '    =    ',
    '         ',
    '       o ',
    ' @    xxx',
    '         ',
    'xxx      ',
    '!!!!!!!!!'
  ],
  [
    '      v  ',
    '         ',
    '  v      ',
    '        o',
    '        x',
    '@   x    ',
    'x        ',
    '!!!!!!!!!'
  ]
];
const actorDict = {
  '@': Player,
  'v': VerticalFireball,
  'o': Coin,
  '=': HorizontalFireball,
  '|': FireRain
     
    
};
const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => console.log('Вы  выиграли приз!'));