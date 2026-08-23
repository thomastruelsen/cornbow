w = {
  row: {},
  rows: 30,
  tilesPerRow: 19,
  tileScale: 20,
  tribute: 100000,
  uni: 0,
  corn: 0,
  weather: "sun",
  r: "rainbow",
  tributeTimer: 3,
  rain: false,
  pause: false,
  locked: false,
  weatherTimer: 0,
  weatherTrack: [0, 1, 0, 1, 3, 0, 1, 0, 1, 4],
  weatherTrackPos: 0,
  cycles: 0,
  ticks: 0,
  tickIntval: 1000,
  damage: 1,
};

const startLoop = () => {
  const weatherDuration = 5;
  adjustValue(100);
  setInterval(() => {
    if (w.pause) return;
    requestAnimationFrame(() => {
      w.ticks++;
      tick();
    });
  }, w.tickIntval);

  const tick = () => {
    const wAni = document.getElementById("wAni");
    if (w.weatherTimer > weatherDuration) {
      w.weatherTimer = 0;
      updateWeather();
    } else {
      w.weatherTimer++;
    }
    wAni.style.setProperty(
      "--wAniProg",
      getWidthProgress(w.weatherTimer, weatherDuration) + "%",
    );

    for (let i = 0; i < w.rows; i++) {
      for (let j = 0; j < w.tilesPerRow; j++) {
        const tile = w.row[i][j];
        tileTick(tile);
      }
    }
  };

  const tileTick = (tile) => {
    if (tile.root) {
      if (tile.root.x === tile.x && tile.root.y === tile.y) {
        if (tile.entity) {
          const prevEntity = tile.entity;
          if (prevEntity.type === "cornHub") {
            prevEntity.growth++;
            if (prevEntity.growth > weatherDuration && prevEntity.lvl < 4) {
              prevEntity.growth = 0;
              removeEntity(tile);
              makeCornHub(tile, prevEntity.lvl + 1, prevEntity);
            } else if (w.weather.includes(w.r) && prevEntity.lvl === 4) {
              removeEntity(tile);
              makeCornHub(tile, prevEntity.lvl + 1, prevEntity);
            } else if (prevEntity.lvl === 5 && !w.weather.includes(w.r)) {
              if (prevEntity.dying) {
                removeEntity(tile);
              } else {
                prevEntity.dying = true;
                animateEntity(tile, "dying");
              }
            }
          }
        }
      }
    }
  };
};
const updateWeather = () => {
  w.weatherTrackPos = (w.weatherTrackPos + 1) % w.weatherTrack.length;
  let spawn = 0;
  const getWeatherFromPos = (pos) => {
    if (pos === 0) {
      spawn = 2;
      return "sun";
    }
    if (pos === 1) {
      spawn = 1;
      return "moon";
    }
    if (pos === 3) {
      spawn = 5;
      return "rain";
    }
    if (pos === 4) {
      spawn = 10;
      w.cycles++;
      return "rain sun " + w.r;
    }
  };

  w.weather = getWeatherFromPos(w.weatherTrack[w.weatherTrackPos]);
  document.getElementById("weatherIcon").className = `${w.weather}`;

  const maxTributeTimeLeft = w.weatherTrack.length * w.tributeTimer;
  const currentTributeTime = w.weatherTrackPos + w.weatherTrackPos * w.cycles;
  document
    .getElementById("tributeTracker")
    .style.setProperty(
      "--prog",
      getWidthProgress(currentTributeTime, maxTributeTimeLeft) + "%",
    );

  if (currentTributeTime >= maxTributeTimeLeft) {
    // Pay or gameover
    w.pause = true;
    w.locked = true;
  } else {
    for (let i = 0; i < spawn; i++) {
      makeCornHub(randomFreeCordinates(), 1);
    }
  }
};

const adjustValue = (amount, type = "corn") => {
  let tempClass = "";
  if (amount < 0) {
    tempClass = "neg";
  }

  if (type === "corn") {
    w.corn += amount;
    if (w.corn < 0) w.corn = 0;
    const elm = document.getElementById("corn");

    if (tempClass) {
      setTimeout(() => {
        elm.classList.add(tempClass);
        elm.classList.remove(tempClass);
      }, w.tickIntval);
    }

    elm.style.setProperty("--num", w.corn);
  } else if (type === "uni") {
    w.uni += amount;
    if (w.uni < 0) w.uni = 0;
    const elm = document.getElementById("uni");
    elm.style.setProperty("--score", w.uni);
    if (tempClass) {
      setTimeout(() => {
        elm.classList.add(tempClass);
        elm.classList.remove(tempClass);
      }, w.tickIntval);
    }
  }
};

const getWidthProgress = (current, max) => {
  return Math.min((current / max) * 100, 100);
};

const newDiv = (className, id) => {
  const elm = document.createElement("div");
  if (className) elm.className = className;
  if (id) elm.id = id;
  return elm;
};

const makeTiles = () => {
  const root = document.getElementById("grid");
  document.body.style.setProperty("--tileScale", w.tileScale + "px");

  for (let i = 0; i < w.rows; i++) {
    const row = newDiv("row", `row-${i}`);
    w.row[i] = {};
    for (let j = 0; j < w.tilesPerRow; j++) {
      const tile = newDiv("tile", `tile-${i}-${j}`);
      row.appendChild(tile);
      w.row[i][j] = {
        elm: tile,
      };
      tile.onclick = () => {
        triggerTitleClick(w.row[i][j]);
      };
      root.appendChild(row);
    }
  }
};

const triggerTitleClick = (tile) => {
  if (tile.root) {
    const rootTile = findRootTile(tile.root);

    console.log("Root tile found", rootTile);

    if (
      rootTile.entity &&
      rootTile.entity.type === "cornHub" &&
      !rootTile.entity.dying
    ) {
      const damage = w.damage;

      adjustValue(rootTile.entity.cornPerHit * damage, "corn");
      rootTile.entity.hp -= damage;
      if (rootTile.entity.hp <= 0) {
        rootTile.entity.dying = true;
        animateEntity(tile, "harvested", false, () => {
          removeEntity(tile);
        });
      } else {
        rootTile.entity.clicked++;
        animateEntity(tile, "attack", true);
      }
    }
  } else {
    triggerRetreat(tile);
  }
};

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

const findRootTile = (cordinates) => {
  const rootTile = w.row[cordinates.y][cordinates.x];
  return rootTile;
};

const triggerRetreat = (tile) => {
  console.log("Retreat triggered", tile);
};

const randomCordinates = () => {
  const row = Math.floor(Math.random() * (w.rows - 2)) + 2;
  const col = Math.floor(Math.random() * w.tilesPerRow);
  return { x: col, y: row };
};

const randomFreeCordinates = (unicorn = false) => {
  let cordinates = randomCordinates();
  while (
    (w.row[cordinates.y][cordinates.x]?.root ||
      w.row[cordinates.y][cordinates.x]?.root ||
      w.row[cordinates.y - 1][cordinates.x]?.root ||
      w.row[cordinates.y - 2][cordinates.x]?.root) &&
    (!unicorn ||
      (unicorn &&
        (w.row[cordinates.y][cordinates.x - 1]?.root ||
          w.row[cordinates.y][cordinates.x + 1]?.root ||
          w.row[cordinates.y - 1][cordinates.x - 1]?.root)))
  ) {
    cordinates = randomCordinates();
  }
  return cordinates;
};

const newEntity = (type, lvl = 1, entityData = {}) => {
  const entity = {
    type: type ?? "unkown",
    lvl: lvl,
    cornPerHit: 1,
    clicked: entityData.clicked ?? 0,
    growth: entityData.growth ?? 0,
    hp: 1,
  };

  if (type === "cornHub") {
    entity.type = "cornHub";

    if (lvl === 1) {
      entity.hp = 1;
      entity.cornPerHit = 0;
    } else if (lvl === 2) {
      entity.hp = 5;
      entity.cornPerHit = 1;
    } else if (lvl === 3) {
      entity.hp = 10;
      entity.cornPerHit = 2;
    } else if (lvl === 4) {
      entity.hp = 20;
      entity.cornPerHit = 4;
    } else if (lvl === 5) {
      entity.hp = 30;
      entity.cornPerHit = 10;
    }
  }
  return entity;
};

const makeCornHub = (cordinates = { x: 0, y: 3 }, lvl = 1, entity) => {
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

const bindControls = () => {
  document.getElementById("weatherIcon").addEventListener("click", () => {
    if (w.locked) return;
    w.pause = !w.pause;
    document.getElementById("main").setAttribute("p", w.pause ? "Paused" : "");
  });
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
  makeCornHub(randomFreeCordinates(), 5);

  makeUnicorn(randomFreeCordinates(true), "common");

  bindControls();
  startLoop();
};

boot();
