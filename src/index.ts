import { DefaultEventsMap } from "@socket.io/component-emitter";
import { io, Socket } from "socket.io-client";

const WS_PORT = 3000;
const WS_URL = `ws://${location.hostname}:${WS_PORT}`;
const CONTAINER_ELEM_ID = "container";
const COLORS = [ "#fff", "#999", "#666", "#333", "#000", "#840", "#f00", "#f80", "#ff0", "#0f0", "#00f", "#f0f" ];
const ROWS = 80;
const COLS = 100;
const TILE_SIZE = 10;
const DRAG_RANGE = 300;
const ZOOM_RANGE = [5, 30];

let cvs: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let socket: Socket<DefaultEventsMap, DefaultEventsMap>;
let selectedColor: number;
let pointer = {
    startingX: 0,
    startingY: 0,
    x: 0,
    y: 0,
    down: false
};
let isDragging = false;
let translateX = 0;
let translateY = 0;
let scale = 10;

function start() {
    let width = COLS * TILE_SIZE;
    let height = ROWS * TILE_SIZE;
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
        updatePointer(e);
    };
    container.onpointermove = (e) => {
        updatePointer(e);
        if (!pointer.down) return;

        if (isDragging)
            updateDragging();
        else
            checkIfDragging();
    };
    container.onpointerup = (e) => {
        updatePointer(e);
        if (pointer.down) return;

        if (isDragging)
            stopDragging();
        else if (e.button === 0)
            pointerPlaceTile(e);
    };
    container.onwheel = (e) => {
        e.preventDefault();

        updateScale(scale - e.deltaY / 50);
        updateTransform(translateX, translateY, scale);
    };

    let cvs: HTMLCanvasElement = document.createElement("canvas");

    cvs = document.createElement("canvas");
    cvs.width = width;
    cvs.height = height;
    cvs.style.background = "#fff";
    cvs.style.position = "absolute";
    cvs.style.display = "block";
    if (width > height) {
        if (width > window.innerWidth * 0.9)
            updateScale(Math.floor((window.innerWidth * 0.9) / width) * 10);
    }
    else {
        if (height > window.innerHeight * 0.9)
            updateScale(Math.floor((window.innerHeight * 0.9) / height) * 10);
    }
    translateX = (window.innerWidth / 2) - (width / 2);
    translateY = (window.innerHeight / 2) - (height / 2);
    updateTransform(translateX, translateY, scale);
    container.appendChild(cvs);

    let _ctx = cvs.getContext("2d");
    if (_ctx == null) throw new Error("The context for the canvas is not available");
    ctx = _ctx;

    socket = io(WS_URL);

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

function checkIfDragging() {
    let diffX = pointer.x - pointer.startingX;
    let diffY = pointer.y - pointer.startingY;

    let distance = Math.abs( diffX**2 + diffY**2 );
    if (distance >= DRAG_RANGE)
        startDragging();
}

function startDragging() {
    pointer.startingX = pointer.x;
    pointer.startingY = pointer.y;
    isDragging = true;
}

function updateDragging() {
    let diffX = pointer.x - pointer.startingX;
    let diffY = pointer.y - pointer.startingY;
    updateTransform(translateX + diffX, translateY + diffY, scale);
}

function stopDragging() {
    translateX += pointer.x - pointer.startingX;
    translateY += pointer.y - pointer.startingY;
    isDragging = false;
}

function updateScale(_scale: number) {
    scale = Math.min(ZOOM_RANGE[1], Math.max(_scale, ZOOM_RANGE[0])); // clamp to range
}

function updateTransform(x: number, y: number, scale: number) {
    cvs.style.transform = `translate(${x}px, ${y}px) scale(${scale / 10})`;
}

function updatePointer(e: PointerEvent) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;

    if (e.type === "pointerdown" && !pointer.down) {
        if (e.button !== 2) {
            pointer.down = true;
            pointer.startingX = pointer.x;
            pointer.startingY = pointer.y;
        }
    }
    else if (e.type === "pointerup" && pointer.down) {
        pointer.down = false;
    }
}

function pointerPlaceTile(e: PointerEvent) {
    let x = Math.floor((e.offsetX - cvs.offsetLeft) / TILE_SIZE);
    let y = Math.floor((e.offsetY - cvs.offsetTop) / TILE_SIZE);

    placeTile(x, y);
    socket.emit("place-tile", [x, y, selectedColor]);
    console.log(`Placed tile (x: ${x}, y: ${y})`);
}

function placeTile(x: number, y: number, color?: number) {
    ctx.fillStyle = COLORS[color || selectedColor];
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

start();
