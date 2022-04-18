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
    cvs.onclick = (e) => {
        let x = e.offsetX - cvs.offsetLeft;
        let y = e.offsetY - cvs.offsetTop;

        placeTile(x, y);
    }
    container.appendChild(cvs);

    let _ctx = cvs.getContext("2d");
    if (_ctx == null) throw new Error("The context for the canvas is not available");
    ctx = _ctx;

    data = [
        [ 7,  2,  1],
        [ 7,  3,  1],
        [ 7,  4,  1],
        [ 7,  1,  2],
        [ 7,  2,  2],
        [ 8,  3,  2],
        [ 8,  4,  2],
        [ 7,  1,  3],
        [ 7,  2,  3],
        [ 7,  3,  3],
        [ 7,  4,  3],
        [ 7,  2,  4],
        [ 7,  3,  4],
        [ 7,  4,  4],
        [ 7,  2,  5],
        [ 7,  4,  5]
    ];

    draw();
}

function draw() {
    for (let tileData of data) {
        ctx.fillStyle = COLORS[tileData[0]];
        ctx.fillRect(tileData[1] * TILE_SIZE, tileData[2] * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

function placeTile(x: number, y: number) {
    x = Math.floor(x / TILE_SIZE);
    y = Math.floor(y / TILE_SIZE);
    ctx.fillStyle = COLORS[activeColor];
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

start();
