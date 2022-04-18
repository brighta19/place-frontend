import { io } from "socket.io-client";

const WS_PORT = 3000;
const WS_URL = `ws://${location.hostname}:${WS_PORT}`;
const CONTAINER_ELEM_ID = "container";
const COLORS = [ "#fff", "#999", "#666", "#333", "#000", "#840", "#f00", "#f80", "#ff0", "#0f0", "#00f", "#f0f" ];
const ROWS = 80;
const COLS = 100;
const TILE_SIZE = 10;
const DRAG_RANGE = 300;

let ctx: CanvasRenderingContext2D;
let selectedColor: number;
let mouse = { startingX: 0, startingY: 0, down: false };
let isDragging = false;

function start() {
    let width = COLS * TILE_SIZE;
    let height = ROWS * TILE_SIZE;
    let translateX = 0;
    let translateY = 0;
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
    container.onpointerdown = (e) => {
        if (e.button === 2) return;

        mouse.startingX = e.clientX;
        mouse.startingY = e.clientY;
        mouse.down = true;
    };
    container.onpointermove = (e) => {
        if (e.button === 2 || !mouse.down) return;

        let x = e.clientX;
        let y = e.clientY;
        let diffX = x - mouse.startingX;
        let diffY = y - mouse.startingY;

        if (isDragging) {
            cvs.style.transform = `translate(${translateX + diffX}px, ${translateY + diffY}px)`;
        }
        else {
            let distance = Math.abs( diffX**2 + diffY**2 );
            isDragging = distance >= DRAG_RANGE;
        }
    };
    container.onpointerup = (e) => {
        if (e.button === 2) return;

        if (isDragging) {
            translateX += e.clientX - mouse.startingX;
            translateY += e.clientY - mouse.startingY;
        }
        else if (e.button === 0) {
            let x = Math.floor((e.offsetX - cvs.offsetLeft) / TILE_SIZE);
            let y = Math.floor((e.offsetY - cvs.offsetTop) / TILE_SIZE);

            placeTile(x, y);
            socket.emit("place-tile", [x, y, selectedColor]);
            console.log(`Placed tile (x: ${x}, y: ${y})`);
        }

        mouse.down = false;
        isDragging = false;
    };

    let cvs: HTMLCanvasElement = document.createElement("canvas");
    cvs.width = width;
    cvs.height = height;
    cvs.style.background = "#fff";
    cvs.style.position = "absolute";
    cvs.style.display = "block";
    cvs.style.transform = `translate(${translateX}px, ${translateY}px) scale(1)`;
    container.appendChild(cvs);

    let _ctx = cvs.getContext("2d");
    if (_ctx == null) throw new Error("The context for the canvas is not available");
    ctx = _ctx;

    const socket = io(WS_URL);

    socket.on("connect", () => {
        console.log("Connected!");
    });

    socket.on("all-tiles", (tiles) => {
        console.log(`Received ${tiles.length} tiles!`);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, cvs.width, cvs.height)
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
