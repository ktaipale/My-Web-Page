import Deck from "./deck.js"

export default class Solitaire {
    // {} on "turvamekanismi", joka takaa ettei ohjelma kaadu parametrien puuttuessa.
    constructor({ seed = Date.now(), allFaceUp = false } = {}) {
        this.seed = seed;
        this.selected = null;

        // Luodaan jako- ja poistopakat.
        this.stock = new Deck(this.seed).cards;
        this.waste = [];

        // Käännä kaikki kortit ylös, jos testimoodi päällä
        if (allFaceUp) {
            this.stock.forEach(c => c.faceUp = true);
        }

        // Luodaan poistopinot.
        this.spades = [];
        this.hearts = [];
        this.clubs = [];
        this.diamonds = [];

        this.foundations = {
            "♠": this.spades,
            "♥": this.hearts,
            "♦": this.diamonds,
            "♣": this.clubs
        };

        // Mapataan HTML-divit
        this.foundationDivs = {
            "♠": document.querySelector(".spades"),
            "♥": document.querySelector(".hearts"),
            "♣": document.querySelector(".clubs"),
            "♦": document.querySelector(".diamonds")
        };

        for (const suit in this.foundationDivs) {
            const div = this.foundationDivs[suit];
            div.addEventListener("click", () => {
                if (!this.selected) return;

                // Siirretään kortti aina sen oman maan foundationiin
                this.tryMoveToFoundation(this.selected.cards[0].suit);
            });
        }

        // Luodaan pelialueen korttipaikat.
        this.cardSlots = [[], [], [], [], [], [], []];

        const gameBoard = document.querySelector(".game-board");
        const maxPileHeight = 20; // suurin mahdollinen korttipino
        const cardRatio = 89 / 58; // korkeus/leveys-suhde
        this.CARD_OVERLAP = Math.min(
            25, // oletuspäällekkäisyys
            (gameBoard.clientHeight - 150) / maxPileHeight
        );

        this.dealCards();

        // Stock pakan klikkaus
        const stockDiv = document.getElementById("stock");
        stockDiv.addEventListener("click", () => this.drawCard());

        // Uusi peli -nappi
        const newGameButton = document.getElementById("new-game");
        newGameButton.addEventListener("click", () => {
            // Luodaan uusi Solitaire-olio samalla seedillä (tai uudella)
            const newSeed = Date.now();
            const gameContainer = document.getElementById("game");
            gameContainer.innerHTML = ""; // tyhjennetään vanha peli
            const newGame = new Solitaire({ seed: newSeed });
            
            // Päivitä seed-näyttö
            document.getElementById("seed-display").textContent = `Seed: ${newGame.getSeed()}`;
        });

        // Tarkista lopetus -nappi
        const testEndButton = document.getElementById("test-end-btn");
        testEndButton.addEventListener("click", () => {
            // Luodaan uusi peli, jossa kaikki kortit ovat faceUp
            const testGame = new Solitaire({ allFaceUp: true });
            const gameContainer = document.getElementById("game");
            gameContainer.innerHTML = ""; // tyhjennetään vanha peli
            
            // Päivitä seed-näyttö
            document.getElementById("seed-display").textContent = `Seed: ${testGame.getSeed()}`;
            
            // Suorita automaattinen loppu
            testGame.autoSolve();
        });

    }

    // Palauttaa pelin seed-arvon HTML-dokumentille näytettäväksi.
    getSeed() {
        return this.seed;
    }

    // Jaetaan kortit pelin aloitustilanteen mukaiseen asetelmaan,
    // jossa korttipinojen korkeus kasvaa yhdellä oikealle mentäessä.
    dealCards() {
        for (let row = 0; row < 7; row++) {
            for (let pile = row; pile < 7; pile++) {
                const card = this.stock.pop();
                this.cardSlots[pile].push(card);
            }
        }
        for (let pile = 0; pile < 7; pile++) {
            const pileCards = this.cardSlots[pile];
            pileCards.forEach((card, index) => {
                card.faceUp = index === pileCards.length - 1;
            });
        }
        this.render();
    }

    drawCard() {
        if (this.stock.length === 0) {
            if (this.waste.length === 0) return;

            // OIKEA kääntö: waste -> stock
            this.stock = this.waste
                .slice()        // kopio
                .reverse();     // KÄÄNNÄ JÄRJESTYS

            this.stock.forEach(card => card.faceUp = false);

            this.waste = [];
            this.selected = null;
            this.clearSelectionHighlight();
            this.render();
            return;
        }

        // Ota päällimmäinen kortti stockista
        const card = this.stock.pop();
        card.faceUp = true;
        this.waste.push(card);

        this.clearSelectionHighlight();
        this.render();
    }

    addSelectionHighlight(pileIndex, cardIndex) {
        const piles = document.querySelectorAll(".lower-row > div");
        const pileDiv = piles[pileIndex];
        if (!pileDiv) return;
        const cardElements = pileDiv.querySelectorAll(".card");
        for (let i = cardIndex; i < cardElements.length; i++) {
            cardElements[i].classList.add("selected");
        }
    }

    clearSelectionHighlight() {
        const selectedCards = document.querySelectorAll(".card.selected");
        selectedCards.forEach(card => card.classList.remove("selected"));
    }

    allCardsFaceUp() {
        // Tarkistaa, että jokainen kortti kaikissa pinoissa on näkyvissä
        for (let pile of this.cardSlots) {
            if (pile.some(card => !card.faceUp)) return false;
        }
        return true;
    }

    checkWin() {
        // Käydään läpi kaikki tableaun pinot (cardSlots)
        for (let pile of this.cardSlots) {
            if (pile.some(card => !card.faceUp)) return false;
        }
        return true;
    }

    autoSolve() {
        if (!this.allCardsFaceUp()) return; // vain jos kaikki kortit näkyvissä

        const order = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

        // Siirretään kortit jokaisesta pinosta
        for (let pileIndex = 0; pileIndex < this.cardSlots.length; pileIndex++) {
            const pile = this.cardSlots[pileIndex];
            while (pile.length) {
                const card = pile.shift(); // poimitaan päällimmäinen kortti
                this.foundations[card.suit].push(card);
            }
        }

        // Siirretään waste-pakan kortit
        while (this.waste.length) {
            const card = this.waste.shift();
            this.foundations[card.suit].push(card);
        }

        this.render(); // päivitä näyttö
        alert("Peli suoritettu loppuun automaattisesti!"); 
    }

    isRed(card) {
        return card.suit === "♥" || card.suit === "♦";
    }

    isOneLower(moving, target) {
        const order = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
        return order.indexOf(moving.value) === order.indexOf(target.value) - 1;
    }

    tryMoveToPile(targetPileIndex) {
        if (!this.selected) return false;

        const targetPile = this.cardSlots[targetPileIndex];
        const movingStack = this.selected.cards;
        const movingCard = movingStack[0];
        const targetCard = targetPile[targetPile.length - 1];

        // TYHJÄ PINO
        if (!targetCard) {
            // Tyhjään pinoon voi siirtää vain K:n (tai pinon, jonka ylin kortti on K)
            if (movingCard.value !== "K") return false;
        } else {
            // Muuten värit ja numerot sääntöjen mukaan
            if (this.isRed(movingCard) === this.isRed(targetCard)) return false;
            if (!this.isOneLower(movingCard, targetCard)) return false;
        }

        // POISTA lähdepinosta
        if (this.selected.source === "pile") {
            const fromPile = this.cardSlots[this.selected.pileIndex];
            fromPile.splice(fromPile.length - movingStack.length, movingStack.length);

            // Käännä uusi päällimmäinen kortti, jos sellainen jää
            const last = fromPile[fromPile.length - 1];
            if (last) {
                last.faceUp = true;

                // Tarkistetaan, onko kaikki tableaun kortit näkyvissä
                if (this.checkWin()) {
                    this.autoSolve();
                }
            }
        } else if (this.selected.source === "waste") {
            this.waste.pop();
        } else if (this.selected.source === "foundation") {
            const foundation = this.foundations[this.selected.suit];
            foundation.pop();
        }

        // LISÄÄ kohteeseen
        targetPile.push(...movingStack);

        // Tyhjennä valinta ja highlight
        this.selected = null;
        this.clearSelectionHighlight();

        // Päivitä renderöinti
        this.render();

        return true;
    }

    tryMoveToFoundation(suit) {
        if (!this.selected) return;

        const movingCard = this.selected.cards[0]; // vain ylin kortti
        const foundation = this.foundations[suit];

        if (movingCard.suit !== suit) return; // väärä maa

        const order = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
        if (foundation.length === 0 && movingCard.value !== "A") return;
        if (foundation.length > 0) {
            const top = foundation[foundation.length - 1];
            if (order.indexOf(movingCard.value) !== order.indexOf(top.value) + 1) return;
        }

        // POISTA lähteestä
        if (this.selected.source === "pile") {
            const fromPile = this.cardSlots[this.selected.pileIndex];
            fromPile.pop(); // vain ylin kortti
            const last = fromPile[fromPile.length - 1];
            if (last) last.faceUp = true;
        } else if (this.selected.source === "waste") {
            this.waste.pop();
        }

        // LISÄÄ foundationiin
        foundation.push(movingCard);
        this.selected = null;
        this.render();
    }
    
    render() {
        this.renderPiles();
        this.renderStock();
        this.renderWaste();
        this.renderFoundations();
    }

    renderPiles() {
        const piles = document.querySelectorAll(".lower-row > div");
        const gameBoard = document.querySelector(".game-board");

        // Suurin mahdollinen korttipino (tableau 7-slot + 13 korttia päälle)
        const maxPileHeight = 20;
        const cardRatio = 89 / 58; // korkeus / leveys

        const availableHeight = gameBoard.clientHeight - 50; // buffer
        const CARD_OVERLAP = Math.min(25, availableHeight / maxPileHeight);

        for (let i = 0; i < 7; i++) {
            const pileDiv = piles[i];
            if (!pileDiv) continue;

            pileDiv.innerHTML = "";
            const pile = this.cardSlots[i];

            if (pile.length === 0) {
                // Tyhjä pino → clickable div
                const emptyDiv = document.createElement("div");
                emptyDiv.classList.add("empty-card-slot");
                const CARD_WIDTH = pileDiv.offsetWidth;
                const CARD_HEIGHT = CARD_WIDTH * cardRatio;
                emptyDiv.style.height = `${CARD_HEIGHT}px`;
                emptyDiv.style.width = `${CARD_WIDTH}px`;
                emptyDiv.style.cursor = "pointer";

                emptyDiv.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const success = this.tryMoveToPile(i);
                    if (!success) {
                        this.selected = null;
                        this.clearSelectionHighlight();
                    }
                });

                pileDiv.appendChild(emptyDiv);
                pileDiv.style.height = `${CARD_HEIGHT}px`;
                pileDiv.style.position = "relative";
            } else {
                // Renderöi kortit pinossa
                pile.forEach((card, index) => {
                    const cardElement = document.createElement("div");
                    cardElement.classList.add("card");

                    if (card.faceUp) {
                        cardElement.classList.add("face-up");
                        const center = document.createElement("div");
                        center.classList.add("center");
                        center.textContent = card.value + card.suit;
                        cardElement.appendChild(center);
                    } else {
                        cardElement.classList.add("face-down");
                    }

                    cardElement.dataset.suit = card.suit;
                    cardElement.dataset.value = card.value;
                    cardElement.style.top = `${index * CARD_OVERLAP}px`;

                    cardElement.addEventListener("click", (e) => {
                        e.stopPropagation();

                        // Poista aiempi highlight
                        this.clearSelectionHighlight();

                        if (this.selected && this.selected.source === "pile" && this.selected.pileIndex === i) {
                            // sama pino uudelleen → peruuta valinta
                            this.selected = null;
                            return;
                        }

                        if (!this.selected) {
                            // Valitse koko pino kortista alaspäin
                            const movingCards = pile.slice(index);
                            this.selected = {
                                source: "pile",
                                pileIndex: i,
                                cards: movingCards
                            };
                            // Lisää highlight valituille korteille
                            this.addSelectionHighlight(i, index);
                            return;
                        }

                        // Jos valittu jo, yritetään siirtoa
                        const success = this.tryMoveToPile(i);
                        if (!success) {
                            this.selected = null;
                            this.clearSelectionHighlight();
                        }
                    });

                    pileDiv.appendChild(cardElement);
                });

                const CARD_WIDTH = pileDiv.offsetWidth;
                const pileHeight = CARD_WIDTH * cardRatio + (pile.length - 1) * CARD_OVERLAP;
                pileDiv.style.height = `${pileHeight}px`;
                pileDiv.style.position = "relative";
            }
        }
    }

    renderStock() {
        const stockDiv = document.getElementById("stock");
        stockDiv.innerHTML = "";

        if (this.stock.length === 0) {
            stockDiv.style.background = "transparent"; // tyhjä pakka
            return;
        }

        // Käännetään päällimmäinen kortti näkyville
        const cardElement = document.createElement("div");
        cardElement.classList.add("card", "face-down");
        stockDiv.appendChild(cardElement);

        // Näytetään jäljellä olevien korttien määrä
        const countDiv = document.createElement("div");
        countDiv.classList.add("count");
        countDiv.textContent = this.stock.length;
        stockDiv.appendChild(countDiv);
    }

    renderWaste() {
        const wasteDiv = document.getElementById("waste");
        wasteDiv.innerHTML = "";

        if (this.waste.length === 0) return;

        const topCard = this.waste[this.waste.length - 1];
        const cardElement = document.createElement("div");
        cardElement.classList.add("card", "face-up");
        cardElement.dataset.suit = topCard.suit;
        cardElement.dataset.value = topCard.value;

        const center = document.createElement("div");
        center.classList.add("center");
        center.textContent = topCard.value + topCard.suit;
        cardElement.appendChild(center);

        // Highlight jos kyseinen kortti on valittu
        if (this.selected && this.selected.source === "waste" && this.selected.cards[0] === topCard) {
            cardElement.classList.add("selected");
        }

        cardElement.addEventListener("click", (e) => {
            e.stopPropagation();
            this.onWasteClick();
        });

        wasteDiv.appendChild(cardElement);
    }

    renderFoundations() {
        for (const suit in this.foundationDivs) {
            const div = this.foundationDivs[suit];
            const foundation = this.foundations[suit];
            div.innerHTML = "";

            if (foundation.length === 0) continue;

            const card = foundation[foundation.length - 1];
            const el = document.createElement("div");
            el.classList.add("card", "face-up");
            el.dataset.suit = card.suit;
            el.dataset.value = card.value;

            const center = document.createElement("div");
            center.classList.add("center");
            center.textContent = card.value + card.suit;
            el.appendChild(center);

            el.addEventListener("click", (e) => {
            e.stopPropagation();

            // peruuta jos sama kortti
            if (
                this.selected &&
                this.selected.source === "foundation" &&
                this.selected.suit === suit
            ) {
                this.selected = null;
                this.clearSelectionHighlight();
                this.render();
                return;
            }

            this.clearSelectionHighlight();

            this.selected = {
                source: "foundation",
                suit,
                cards: [card]
            };

            el.classList.add("selected");
        });

            div.appendChild(el);
        }
    }

    onWasteClick() {
        const card = this.waste[this.waste.length - 1];
        if (!card) return;

        // Jos sama kortti on jo valittu, peruuta valinta
        if (this.selected && this.selected.source === "waste" && this.selected.cards[0] === card) {
            this.selected = null;
            this.clearSelectionHighlight();
            this.render();
            return;
        }

        // Poista aiempi highlight
        this.clearSelectionHighlight();

        // Aseta valittu kortti
        this.selected = {
            source: "waste",
            pileIndex: null,
            cards: [card]
        };

        this.render();
    }
}