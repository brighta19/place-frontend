const CONTAINER_ELEM_ID = "container";
const COLORS = [ "#fff", "#999", "#666", "#333", "#000", "#840", "#f00", "#f80", "#ff0", "#0f0", "#00f", "#f0f" ];
const ROWS = 80;
const COLS = 100;
const TILE_SIZE = 10;

let ctx: CanvasRenderingContext2D;
let data: number[][];
let activeColor: number;

function start() {
    let buttonElems: HTMLButtonElement[] = [];
    for (let i = 0; i < COLORS.length; i++) {
        let selector = `button[data-color="${i}"]`;
        let _button: HTMLButtonElement | null = document.querySelector(selector)
        if (_button == null) throw new Error(`Could not find ${selector}`);
        _button.onclick = () => {
            buttonElems[activeColor].classList.remove('active');
            _button?.classList.add('active');
            let color = _button?.dataset.color;
            if (color === undefined) throw new Error("No data-color attribuite")
            activeColor = Number(color);
        };
        buttonElems.push(_button);
    }

    let _activeColor = buttonElems.findIndex((btn) => btn.classList.contains("active"));
    if (_activeColor == -1)
        buttonElems[0].click();
    else
        activeColor = _activeColor;

    let container: HTMLDivElement | null = document.querySelector(`div#${CONTAINER_ELEM_ID}`);
    if (container == null) throw new Error("There is no div element with id " + CONTAINER_ELEM_ID);

    let cvs: HTMLCanvasElement = document.createElement("canvas");
    cvs.style.background = "#fff";
    cvs.width = COLS * TILE_SIZE;
    cvs.height = ROWS * TILE_SIZE;
    container.appendChild(cvs);

    let _ctx = cvs.getContext("2d");
    if (_ctx == null) throw new Error("The context for the canvas is not available");
    ctx = _ctx;

    data = [
        [ 0,  0,  0],
        [ 1,  1,  1],
        [ 2,  2,  2],
        [ 3,  3,  3],
        [ 4,  4,  4],
        [ 5,  5,  5],
        [ 6,  6,  6],
        [ 7,  7,  7],
        [ 8,  8,  8],
        [ 9,  9,  9],
        [10, 10, 10],
        [11, 11, 11],
        [12, 12, 12],
    ];

    draw();
}

function draw() {
    for (let tileData of data) {
        ctx.fillStyle = COLORS[tileData[0]];
        ctx.fillRect(tileData[1] * TILE_SIZE, tileData[2] * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

start();
