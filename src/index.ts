import { io } from "socket.io-client";

const WEBSOCKET_URL = `ws://${location.hostname}:3000`;
const CONTAINER_ELEM_ID = "container";
const COLORS = [ "#fff", "#999", "#666", "#333", "#000", "#840", "#f00", "#f80", "#ff0", "#0f0", "#00f", "#f0f" ];
const ROWS = 80;
const COLS = 100;
const TILE_SIZE = 10;

let ctx: CanvasRenderingContext2D;
let selectedColor: number;

function start() {
    let buttonElems: HTMLButtonElement[] = [];
    for (let i = 0; i < COLORS.length; i++) {
        let selector = `button[data-color="${i}"]`;
        let _button: HTMLButtonElement | null = document.querySelector(selector)
        if (_button == null) throw new Error(`Could not find ${selector}`);
        _button.onclick = () => {
            buttonElems[selectedColor].classList.remove('active');
            _button?.classList.add('active');
            let color = _button?.dataset.color;
            if (color === undefined) throw new Error("No data-color attribuite")
            selectedColor = Number(color);
        };
        buttonElems.push(_button);
    }

    let _activeColor = buttonElems.findIndex((btn) => btn.classList.contains("active"));
    if (_activeColor == -1)
        buttonElems[0].click();
    else
        selectedColor = _activeColor;


    let container: HTMLDivElement | null = document.querySelector(`div#${CONTAINER_ELEM_ID}`);
    if (container == null) throw new Error("There is no div element with id " + CONTAINER_ELEM_ID);

    let cvs: HTMLCanvasElement = document.createElement("canvas");
    cvs.style.background = "#fff";
    cvs.width = COLS * TILE_SIZE;
    cvs.height = ROWS * TILE_SIZE;
    cvs.onclick = (e) => {
        let x = e.offsetX - cvs.offsetLeft;
        let y = e.offsetY - cvs.offsetTop;

        x = Math.floor(x / TILE_SIZE);
        y = Math.floor(y / TILE_SIZE);

        console.log(`Placed tile (x: ${x}, y: ${y})`);
        socket.emit("place-tile", [x, y, selectedColor]);
        placeTile(x, y);
    }
    container.appendChild(cvs);

    let _ctx = cvs.getContext("2d");
    if (_ctx == null) throw new Error("The context for the canvas is not available");
    ctx = _ctx;

    const socket = io(WEBSOCKET_URL);

    socket.on("connect", () => {
        console.log("Connected!");
    });

    socket.on("all-tiles", (tiles) => {
        console.log(`Received tiles!`);
        console.log(tiles);
        ctx.clearRect(0, 0, cvs.width, cvs.height)
        for (let tile of tiles) {
            let pos = tile[0].split(',')
            placeTile(pos[0], pos[1], tile[1]);
        }
    })

    socket.on("new-tile", (data) => {
        let [x, y, color] = data;
        console.log(`Received tile (x: ${x}, y: ${y})`);
        placeTile(x, y, color);
    });
}

function placeTile(x: number, y: number, color?: number) {
    ctx.fillStyle = COLORS[color || selectedColor];
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

start();
