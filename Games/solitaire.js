import Deck from "./deck.js"

class Game {
    constructor() {
        this.deck = new Deck();
        this.seed = this.deck.getSeed();
    }
}
const game = new Game();
console.log(game)
console.log(game.seed)