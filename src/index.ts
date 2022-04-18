import { DefaultEventsMap } from "@socket.io/component-emitter";
import { io, Socket } from "socket.io-client";

type Pointer = {
    id: number,
    type: string,
    button: number,
    startingX: number,
    startingY: number,
    x: number,
    y: number
}

const WS_PORT = 3000;
const WS_URL = `ws://${location.hostname}:${WS_PORT}`;
const CONTAINER_ELEM_ID = "container";
const COLORS = [ "#fff", "#999", "#666", "#333", "#000", "#840", "#f00", "#f80", "#ff0", "#0f0", "#00f", "#f0f" ];
const ROWS = 80;
const COLS = 100;
const TILE_SIZE = 10;
const DRAG_RANGE = 300;
const ZOOM_RANGE = [2, 30];

let cvs: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let socket: Socket<DefaultEventsMap, DefaultEventsMap>;
let selectedColor: number;
let pointers: Pointer[] = [];
let canDrag = false;
let wasZoomed = false;
let isDragging = false;
let isZooming = false;
let translateX = 0;
let translateY = 0;
let translateDiffX = 0;
let translateDiffY = 0;
let zoomStartingDistance = 0;
let zoomDiff = 0;
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
        createPointer(e);
    };
    container.onpointermove = (e) => {
        updatePointer(e);

        if (pointers.length === 1) {
            if (canDrag) { // Drag
                if (isZooming)
                    stopZooming();
                if (!isDragging)
                    startDragging();

                updateDragValues();
                updateTransform(translateX + translateDiffX, translateY + translateDiffY, scale);
            }
            else {
                updateDragValues();

                let distance = Math.abs(translateDiffX ** 2 + translateDiffY ** 2);
                if (distance >= DRAG_RANGE)
                    canDrag = true;
            }

        }
        else if (pointers.length === 2) { // Zoom
            if (isDragging)
                stopDragging();
            if (!isZooming)
                startZooming();

            updateZoomValues();
            updateTransform(translateX, translateY, getClampedScale(scale * zoomDiff));
            wasZoomed = true;
        }
    };
    container.onpointerup = (e) => {
        updatePointer(e);

        if (pointers.length === 1) {
            if (isDragging)
                stopDragging();
            else if (!canDrag && !wasZoomed)
                pointerPlaceTile(e);
            canDrag = false;
            wasZoomed = false;
        }
        else if (pointers.length === 2 && isZooming) {
            stopZooming();
        }

        removePointer(e);
    };
    container.onwheel = (e) => {
        e.preventDefault();

        scale = getClampedScale(scale - e.deltaY / 50);
        updateTransform(translateX, translateY, scale);
    };

    cvs = document.createElement("canvas");
    cvs.width = width;
    cvs.height = height;
    cvs.style.background = "#fff";
    cvs.style.position = "absolute";
    cvs.style.display = "block";
    if (width > height) {
        if (width > window.innerWidth * 0.9)
            scale = getClampedScale(Math.floor((window.innerWidth * 0.9) / width) * 10);
    }
    else {
        if (height > window.innerHeight * 0.9)
            scale = getClampedScale(Math.floor((window.innerHeight * 0.9) / height) * 10);
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

function startDragging() {
    isDragging = true;
    pointers[0].startingX = pointers[0].x;
    pointers[0].startingY = pointers[0].y;
}

function stopDragging() {
    translateX += translateDiffX;
    translateY += translateDiffY;
    isDragging = false;
}

function updateDragValues() {
    translateDiffX = pointers[0].x - pointers[0].startingX;
    translateDiffY = pointers[0].y - pointers[0].startingY;
}

function startZooming() {
    isZooming = true;
    zoomStartingDistance = Math.abs(
        (pointers[0].x - pointers[1].x)**2 +
        (pointers[0].y - pointers[1].y)**2
    );
}

function stopZooming() {
    scale = getClampedScale(scale * zoomDiff);
    isZooming = false;
}

function updateZoomValues() {
    let distance = Math.abs(
        (pointers[0].x - pointers[1].x)**2 +
        (pointers[0].y - pointers[1].y)**2
    );
    zoomDiff = distance / zoomStartingDistance;
}

function getClampedScale(_scale: number) {
    return Math.min(ZOOM_RANGE[1], Math.max(_scale, ZOOM_RANGE[0]));
}

function updateTransform(x: number, y: number, scale: number) {
    cvs.style.transform = `translate(${x}px, ${y}px) scale(${scale / 10})`;
}

function updatePointer(e: PointerEvent) {
    let pointer = pointers.find((p) => p.id === e.pointerId);
    if (pointer === undefined) return;

    pointer.x = e.clientX;
    pointer.y = e.clientY;
}

function createPointer(e: PointerEvent) {
    pointers.push({
        id: e.pointerId,
        type: e.pointerType,
        button: e.button,
        startingX: e.clientX,
        startingY: e.clientY,
        x: e.clientX,
        y: e.clientY
    });
}

function removePointer(e: PointerEvent) {
    let pointerIndex = pointers.findIndex((p) => p.id === e.pointerId);
    if (pointerIndex !== -1)
        pointers.splice(pointerIndex, 1);
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
