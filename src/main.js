w = {
  row: {},
  rows: 20,
  tilesPerRow: 20,
  tileScale: 30,
};

const newDiv = (className, id) => {
  const elm = document.createElement("div");
  if (className) elm.className = className;
  if (id) elm.id = id;
  return elm;
};

const makeTiles = () => {
  const root = document.getElementById("grid");
  root.style.setProperty("--tileScale", w.tileScale + "px");

  for (let i = 0; i < w.rows; i++) {
    const row = newDiv("row", `row-${i}`);
    w.row[i] = {};
    for (let j = 0; j < w.tilesPerRow; j++) {
      const tile = newDiv("tile", `tile-${i}-${j}`);
      row.appendChild(tile);
      w.row[i][j] = {
        elm: tile,
      };
    }
    root.appendChild(row);
  }
};

const randomCordinates = () => {
  const row = Math.floor(Math.random() * (w.rows - 2)) + 2;
  const col = Math.floor(Math.random() * w.tilesPerRow);
  return { x: col, y: row };
};

const randomFreeCordinates = () => {
  let cordinates = randomCordinates();
  while (
    w.row[cordinates.y][cordinates.x]?.root ||
    w.row[cordinates.y][cordinates.x]?.unicornRoot ||
    w.row[cordinates.y][cordinates.x - 1]?.root ||
    w.row[cordinates.y][cordinates.x - 1]?.unicornRoot
  ) {
    cordinates = randomCordinates();
  }
  return cordinates;
};

/***
     * 
    lvl 1 Plant [1 hp][0 corn per hit]
    lvl 2 Green small cornhub. Plant [5 hp][1 corn per hit]
    lvl 3 Yellow small cornhub. Plant [10 hp][2 corn per hit]
    lvl 4 Yellow big cornhub. Plant [20 hp][4 corn per hit]
    lvl 5 Rainbow big cornhub Plant [30 hp][10 corn per hit] transforms during rainbow.
    */
const makeCornHub = (cordinates = { x: 0, y: 3 }, lvl = 1) => {
  if (lvl > 5) lvl = 5;
  const cornHubRoot = newDiv(`cornHub root lvl${lvl} `);
  w.row[cordinates.y][cordinates.x].elm.appendChild(cornHubRoot);
  w.row[cordinates.y][cordinates.x].corn = {
    elm: cornHubRoot,
    root: cordinates,
    lvl: lvl,
  };
  const rootLocation = cordinates;
  if (lvl > 3) {
    const cornhubTop = newDiv(`cornHub top lvl${lvl}`);
    w.row[cordinates.y - 2][cordinates.x].elm.appendChild(cornhubTop);
    w.row[cordinates.y - 2][cordinates.x].root = rootLocation;
    const cornHubMid = newDiv(`cornHub mid lvl${lvl}`);
    w.row[cordinates.y - 1][cordinates.x].elm.appendChild(cornHubMid);
    w.row[cordinates.y - 1][cordinates.x].root = rootLocation;
  } else if (lvl > 1) {
    const cornHubTop = newDiv(`cornHub top lvl${lvl}`);
    w.row[cordinates.y - 1][cordinates.x].elm.appendChild(cornHubTop);
    w.row[cordinates.y - 1][cordinates.x].root = rootLocation;
  }
};

const makeUnicorn = (cordinates = { x: 0, y: 3 }, type = "common") => {
  if (cordinates.x < 1 || cordinates.x + 1 > w.tilesPerRow - 1) {
    console.log("Invalid x cordinate for unicorn");
    return;
  }
  const rootCords = w.row[cordinates.y][cordinates.x];
  const unicorn = newDiv(`unicorn ${type} body`);
  rootCords.elm.appendChild(unicorn);
  rootCords.unicorn = true;
  rootCords.unicornType = type;
  rootCords.unicornRoot = cordinates;

  const unicornHead = newDiv(`unicorn ${type} head`);
  w.row[cordinates.y - 1][cordinates.x - 1].elm.appendChild(unicornHead);
  w.row[cordinates.y - 1][cordinates.x - 1].unicornRoot = cordinates;

  const unicornTail = newDiv(`unicorn ${type} body tail`);
  w.row[cordinates.y][cordinates.x + 1].elm.appendChild(unicornTail);
  w.row[cordinates.y][cordinates.x + 1].unicornRoot = cordinates;

  const unicornFrontLegs = newDiv(`unicorn ${type} legs front`);
  w.row[cordinates.y + 1][cordinates.x].elm.appendChild(unicornFrontLegs);
  w.row[cordinates.y + 1][cordinates.x].unicornRoot = cordinates;

  const unicornBackLegs = newDiv(`unicorn ${type} legs back`);
  w.row[cordinates.y + 1][cordinates.x + 1].elm.appendChild(unicornBackLegs);
  w.row[cordinates.y + 1][cordinates.x + 1].unicornRoot = cordinates;
};

const boot = () => {
  console.log("Booting up...");
  makeTiles();

  makeCornHub(randomFreeCordinates(), 1);
  makeCornHub(randomFreeCordinates(), 2);
  makeCornHub(randomFreeCordinates(), 3);
  makeCornHub(randomFreeCordinates(), 4);
  makeCornHub(randomFreeCordinates(), 5);

  makeUnicorn(randomFreeCordinates(), "common");
};

boot();
