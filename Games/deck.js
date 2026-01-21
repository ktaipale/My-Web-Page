const SUIT = ["♠", "♣", "♥", "♦"]
const VALUE = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

export default class Deck {
    // Seed = pelin aloitushetki millisekunteina
    constructor(seed = Date.now()) {
        this.seed = seed;
        // Luodaan random-funktio tallentamalla random-muuttujaan funktio, jonka
        // mulberry32 palauttaa. Tämän jälkeen funktiota voidaan kutsua random() komennolla.
        this.random = mulberry32(seed);
        this.cards = createDeck();
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const newIndex = Math.floor(this.random() * (i + 1));
            const originalCard = this.cards[newIndex];
            this.cards[newIndex] = this.cards[i];
            this.cards[i] = originalCard;
        }
    }

    getSeed() {
        return this.seed;
    }
}
    
// PRNG-funktio pelin satunnaisuuden luomiseksi. Mahdollistaa seed-arvon uudelleenkäytön.
function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
        // Palautetaan funktio, jolla lasketaan uusi satunnaisluku. T:n arvo säilyy muistissa
        // seuraaville kierroksille, koska JavaScript säilyttää viittauksen ulkoisiin muuttujiin.
        // Näin ollen satunnaisluku ei ole seuraavilla kerroilla sama, vaan sitä laskettaessa 
        // hyödynnetään edellisellä kerralla saatua t:n arvoa.
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

}

function createDeck() {
    // Käydään läpi jokainen maa ja jokainen numero ja luodaan jokaisella yhdistelmällä oma kortti.
    // Periaate täysin sama kuin kaksi sisäkkäistä for-looppia.
    return SUIT.flatMap(suit => {
        return VALUE.map(value => {
            return new Card(suit, value);
        })
    })
}