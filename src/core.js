const w = {
  row: {},
  rows: 30,
  tilesPerRow: 19,
  tileScale: 20,
  tribute: 100000,
  uni: 0,
  corn: 0,
  magazine: 10,
  weather: "sun",
  r: "rainbow",
  tributeTimer: 3,
  pause: false,
  locked: false,
  weatherTimer: 0,
  weatherTrack: [0, 1, 0, 1, 3, 0, 1, 0, 1, 4],
  weatherTrackPos: 0,
  uniHits: 0,
  cycles: 0,
  ticks: 0,
  tickIntval: 1000,
  damage: 1,
  trail: false,
};
window.w = w;

const getWidthProgress = (current, max) => {
  return Math.min((current / max) * 100, 100);
};

const newDiv = (className, id) => {
  const elm = document.createElement("div");
  if (className) elm.className = className;
  if (id) elm.id = id;
  return elm;
};

const randomCordinates = () => {
  const row = Math.floor(Math.random() * (w.rows - 3)) + 2;
  const col = Math.floor(Math.random() * w.tilesPerRow);
  return { x: col, y: row };
};

const randomFreeCordinates = (unicorn = false) => {
  const maxAttempts = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const cordinates = randomCordinates();

    const occupied =
      w.row[cordinates.y][cordinates.x]?.root ||
      w.row[cordinates.y - 1][cordinates.x]?.root ||
      w.row[cordinates.y - 2][cordinates.x]?.root;

    const unicornBlocked =
      unicorn &&
      (w.row[cordinates.y][cordinates.x - 1]?.root ||
        w.row[cordinates.y][cordinates.x + 1]?.root ||
        w.row[cordinates.y - 1][cordinates.x - 1]?.root);

    if (!occupied && !unicornBlocked) {
      return cordinates;
    }
  }

  return null;
};

const makeTiles = () => {
  const root = document.getElementById("grid");
  document.body.style.setProperty("--tileScale", w.tileScale + "px");
  document.body.style.setProperty(
    "--totalTileWidth",
    w.tileScale * w.tilesPerRow + "px",
  );
  for (let i = 0; i < w.rows; i++) {
    const row = newDiv("row", `row-${i}`);
    w.row[i] = {};
    for (let j = 0; j < w.tilesPerRow; j++) {
      const tile = newDiv("tile", `tile-${i}-${j}`);
      row.appendChild(tile);
      w.row[i][j] = {
        elm: tile,
        x: j,
        y: i,
      };
      tile.onclick = (e) => {
        triggerTitleClick(e, w.row[i][j]);
      };
      root.appendChild(row);
    }
  }
};

const findRootTile = (cordinates) => {
  const rootTile = w.row[cordinates.y][cordinates.x];
  return rootTile;
};

w.getWidthProgress = getWidthProgress;
w.randomCordinates = randomCordinates;
w.rngCords = randomFreeCordinates;
w.newdiv = newDiv;
w.makeTiles = makeTiles;
w.findRootTile = findRootTile;

const animateEntity = (tile, animation = "", reset = false, cb) => {
  if (tile.root) {
    const findAndAnimateAllWithRoot = (root) => {
      for (let i = 0; i < w.rows; i++) {
        for (let j = 0; j < w.tilesPerRow; j++) {
          const tile = w.row[i][j];
          if (tile.root && tile.root.x === root.x && tile.root.y === root.y) {
            const t = tile.elm;
            const elms = t.getElementsByClassName("entity");
            if (elms.length > 0) {
              elms[0].classList.add(animation);
              setTimeout(() => {
                if (reset) {
                  elms[0]?.classList?.remove(animation);
                }
                if (cb) {
                  cb();
                }
              }, w.tickIntval * 0.2);
            }
          }
        }
      }
    };
    findAndAnimateAllWithRoot(tile.root);
  }
};

/**
 * Remove entity and all its associated tiles from the grid.
 */
const removeEntity = (tile) => {
  if (tile.root) {
    const rootTile = findRootTile(tile.root);
    const findAndRemoveAllWithThisRoot = (root) => {
      for (let i = 0; i < w.rows; i++) {
        for (let j = 0; j < w.tilesPerRow; j++) {
          const tile = w.row[i][j];
          if (tile.root && tile.root.x === root.x && tile.root.y === root.y) {
            tile.entity = null;
            tile.elm.innerHTML = "";
            tile.root = null;
          }
        }
      }
    };
    findAndRemoveAllWithThisRoot(rootTile.root);
    if (rootTile.entity) {
      rootTile.entity = null;
      rootTile.elm.innerHTML = "";
      rootTile.root = null;
    }
  }
};

const newEntity = (type, lvl = 1, entityData = {}) => {
  const entity = {
    type: type ?? "unkown",
    lvl: lvl,
    cornDrop: 0,
    clicked: entityData.clicked ?? 0,
    growth: entityData.growth ?? 0,
    hp: 1,
  };

  if (type === "cornHub") {
    entity.type = "cornHub";

    if (lvl === 1) {
      entity.hp = 1;
      entity.cornDrop = 0;
    } else if (lvl === 2) {
      entity.hp = 5;
      entity.cornDrop = 5;
    } else if (lvl === 3) {
      entity.hp = 10;
      entity.cornDrop = 50;
    } else if (lvl === 4) {
      entity.hp = 20;
      entity.cornDrop = 100;
    } else if (lvl === 5) {
      entity.hp = 30;
      entity.cornDrop = 250;
    }
  } else if (type === "unicorn") {
    entity.hp = 10;
    entity.damage = 100;
  }
  return entity;
};

const makeCornHub = (cordinates = { x: 0, y: 3 }, lvl = 1, entity) => {
  if (!cordinates) {
    return;
  }
  let animateGrowth = false;
  const baseClass = "cornHub entity";
  if (lvl > 5) lvl = 5;

  if (entity && entity.lvl < lvl) {
    animateGrowth = true;
  }
  const cornHubRoot = newDiv(
    `${baseClass} root lvl${animateGrowth ? lvl - 1 : lvl} `,
  );
  const cornRoot = w.row[cordinates.y][cordinates.x];
  cornRoot.elm.appendChild(cornHubRoot);
  cornRoot.root = cordinates;
  cornRoot.entity = newEntity("cornHub", lvl, entity);
  cornRoot.x = cordinates.x;
  cornRoot.y = cordinates.y;

  setTimeout(() => {
    cornHubRoot.className = `${baseClass} root lvl${lvl}`;
  }, w.tickIntval * 0.5);

  const rootLocation = cordinates;
  if (lvl > 3) {
    const cornHubTop = newDiv(
      `${baseClass} top lvl${animateGrowth ? lvl - 1 : lvl}`,
    );
    w.row[cordinates.y - 2][cordinates.x].elm.appendChild(cornHubTop);
    w.row[cordinates.y - 2][cordinates.x].root = rootLocation;
    const cornHubMid = newDiv(
      `${baseClass} mid lvl${animateGrowth ? lvl - 1 : lvl}`,
    );
    w.row[cordinates.y - 1][cordinates.x].elm.appendChild(cornHubMid);
    w.row[cordinates.y - 1][cordinates.x].root = rootLocation;

    setTimeout(() => {
      cornHubMid.className = `${baseClass} mid lvl${lvl}`;
    }, w.tickIntval * 0.6);

    setTimeout(() => {
      cornHubTop.className = `${baseClass} top lvl${lvl}`;
    }, w.tickIntval * 0.7);
  } else if (lvl > 1) {
    const cornHubTop = newDiv(
      `${baseClass} top lvl${animateGrowth ? lvl - 1 : lvl}`,
    );
    w.row[cordinates.y - 1][cordinates.x].elm.appendChild(cornHubTop);
    w.row[cordinates.y - 1][cordinates.x].root = rootLocation;

    setTimeout(() => {
      cornHubTop.className = `${baseClass} top lvl${lvl}`;
    }, w.tickIntval * 0.6);
  }
};

const makeUnicorn = (cordinates = { x: 0, y: 3 }, type = "common") => {
  if (!cordinates) {
    return;
  }
  if (
    cordinates.x < 1 ||
    cordinates.x + 1 > w.tilesPerRow - 1 ||
    cordinates.y < 1 ||
    cordinates.y + 1 > w.rows - 1
  ) {
    console.log("Invalid x cordinate for unicorn");
    return;
  }
  const rootCords = w.row[cordinates.y][cordinates.x];
  const baseClass = "unicorn entity";
  const unicorn = newDiv(` ${baseClass} ${type} body`);
  rootCords.elm.appendChild(unicorn);
  rootCords.entity = newEntity("unicorn", 1);
  rootCords.root = cordinates;
  rootCords.x = cordinates.x;
  rootCords.y = cordinates.y;

  const unicornHead = newDiv(`${baseClass} ${type} head`);
  w.row[cordinates.y - 1][cordinates.x - 1].elm.appendChild(unicornHead);
  w.row[cordinates.y - 1][cordinates.x - 1].root = cordinates;

  const unicornTail = newDiv(`${baseClass} ${type} body tail`);
  w.row[cordinates.y][cordinates.x + 1].elm.appendChild(unicornTail);
  w.row[cordinates.y][cordinates.x + 1].root = cordinates;

  const unicornFrontLegs = newDiv(`${baseClass} ${type} legs front`);
  w.row[cordinates.y + 1][cordinates.x].elm.appendChild(unicornFrontLegs);
  w.row[cordinates.y + 1][cordinates.x].root = cordinates;

  const unicornBackLegs = newDiv(`${baseClass} ${type} legs back`);
  w.row[cordinates.y + 1][cordinates.x + 1].elm.appendChild(unicornBackLegs);
  w.row[cordinates.y + 1][cordinates.x + 1].root = cordinates;
};

const bindControls = (options) => {
  document.getElementById("weatherIcon").addEventListener("click", () => {
    if (w.locked) return;
    w.pause = !w.pause;
    document.getElementById("main").setAttribute("p", w.pause ? "Paused" : "");
  });

  document.getElementById("backdrop").addEventListener("click", (e) => {
    if (w.locked || w.pause) return;
    const x = e.clientX < w.tileScale * w.tilesPerRow ? 0 : w.tilesPerRow - 1;
    const y = Math.round((e.clientY - options.header) / w.tileScale);

    console.log("Backdrop clicked", x, y);

    fireBow(w.row[y][x]);
  });

  document.getElementById("payTribute").addEventListener("click", () => {
    w.pause = true;
    w.locked = true;
    adjustValue(w.tribute, "uni");
    adjustValue(-w.tribute, "corn");
    adjustValue(-w.tribute, "trib");
  });
};

const reload = () => {
  const magazineElm = document.getElementById("magazine");
  for (let i = 0; i < w.magazine - 1; i++) {
    magazineElm.appendChild(newDiv("cornP"));
  }
  document.getElementById("ammo").appendChild(newDiv("cornP"));
};

const boot = () => {
  console.log("Booting up...");

  w.lore =
    "Cornium, the Cornlord demands tribute! Pay " +
    w.tribute +
    " corn before the " +
    w.tributeTimer +
    "th " +
    w.r +
    " appears or face his wrath!";
  makeTiles();

  makeCornHub(randomFreeCordinates(), 1);
  makeCornHub(randomFreeCordinates(), 2);
  makeCornHub(randomFreeCordinates(), 3);
  makeCornHub(randomFreeCordinates(), 4);
  makeCornHub(randomFreeCordinates(), 4);
  makeCornHub(randomFreeCordinates(), 4);
  makeCornHub(randomFreeCordinates(), 5);

  makeUnicorn(randomFreeCordinates(true), "common");

  //lockLayoutForMath;
  const headH = 50;
  document.getElementById("header").style.maxHeight = headH + "px";

  bindControls({ header: headH });
  reload();
  startLoop();
};
