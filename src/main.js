const startLoop = () => {
  const weatherDuration = 20;
  adjustValue(100);
  adjustValue(w.tribute, "trib");
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
    if (w.corn < w.tribute) {
      gameOver("You failed to pay the tribute!");
    }
  } else {
    for (let i = 0; i < spawn; i++) {
      makeCornHub(randomFreeCordinates(), 1);
    }
  }
};

const adjustValue = (amount = 0, type = "corn") => {
  let tempClass = "";
  if ((amount < 0 && type !== "trib") || (amount > 0 && type === "trib")) {
    tempClass = "neg";
  }

  if (type === "corn") {
    w.corn += amount;
    if (w.corn < 0) w.corn = 0;
    if (w.corn >= w.tribute) {
      document.getElementById("payTribute").disabled = false;
    } else {
      document.getElementById("payTribute").disabled = true;
    }

    const elm = document.getElementById("corn");

    if (tempClass) {
      elm.classList.add(tempClass);
      setTimeout(() => {
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
      elm.classList.add(tempClass);
      setTimeout(() => {
        elm.classList.remove(tempClass);
      }, w.tickIntval);
    }
  } else if (type === "trib") {
    w.tribute += amount;
    if (w.tribute < 0) w.tribute = 0;
    const elm = document.getElementById("trib");
    elm.style.setProperty("--trib", w.tribute);
    if (tempClass) {
      elm.classList.add(tempClass);
      setTimeout(() => {
        elm.classList.remove(tempClass);
      }, w.tickIntval);
    }
  }
};

const damageTile = (tile, damage) => {
  console.count("Damage tile called");
  if (tile.root) {
    const rootTile = findRootTile(tile.root);
    if (rootTile.entity && !rootTile.entity.dying) {
      if (rootTile.entity.type === "cornHub") {
        rootTile.entity.hp -= damage;
        console.log("CornHub HP:", rootTile.entity.hp);
        if (rootTile.entity.hp <= 0) {
          rootTile.entity.dying = true;
          const deathlvl = rootTile.entity.lvl;
          for (let i = 0; i < deathlvl; i++) {
            setTimeout(() => {
              window.requestAnimationFrame(() => {
                makeCornProjectile(
                  tile.elm,
                  document.getElementById("corn"),
                  true,
                );
              });
            }, i * 100);
          }
          adjustValue(rootTile.entity.cornDrop, "corn");
          animateEntity(tile, "harvested", false, () => {
            removeEntity(tile);
          });
        } else {
          rootTile.entity.clicked++;
          animateEntity(tile, "attack", true);
        }
      } else if (rootTile.entity.type === "unicorn") {
        rootTile.entity.hp -= damage;
        if (rootTile.entity.hp <= 0) {
          rootTile.entity.dying = true;
          animateEntity(tile, "dying", false, () => {
            removeEntity(tile);
          });
        } else {
          rootTile.entity.clicked++;
          animateEntity(tile, "attack", true);
          adjustValue(0 - rootTile.entity.damage, "corn");
          adjustValue(rootTile.entity.damage * w.uniHits, "trib");
          w.uniHits++;
        }
      }
    }
  }
};
const triggerTitleClick = (tile) => {
  if (tile.root) {
    const rootTile = findRootTile(tile.root);
    console.log("Root tile found", rootTile);
  }

  if (tile) {
    fireBow(tile);
  }
};

const gameOver = (msg = "") => {
  w.pause = true;
  w.locked = true;
  if (confirm("Game Over! " + msg)) {
    location.reload();
  }
};

const makeCornProjectile = (fromElm, toElm, randomize = false) => {
  const projectile = newDiv("cornP");
  fromElm.appendChild(projectile);

  const fromRect = fromElm.getBoundingClientRect();
  const toRect = toElm.getBoundingClientRect();
  const deltaX = toRect.left - fromRect.left;
  const deltaY = toRect.top - fromRect.top;

  if (randomize) {
    projectile.style.left = `${Math.round(Math.random() * 15)}px`;
    projectile.style.top = `${Math.round(Math.random() * 15)}px`;
    projectile.style.transform = `translate(${deltaX + Math.random() * 10 - 5}px, ${deltaY + Math.random() * 10 - 5}px)`;
  } else {
    projectile.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }
  setTimeout(() => {
    projectile.remove();
  }, w.tickIntval * 1.2);
};

const getProjectilePath = (entryTile, targetTile) => {
  const path = [];

  const start = {
    x: entryTile.x,
    y: entryTile.y,
  };

  const end = {
    x: targetTile.x,
    y: targetTile.y,
  };

  const dx = end.x - start.x;

  for (let y = start.y - 1; y >= end.y; y--) {
    const progress = (start.y - y) / (start.y - end.y);
    const x = start.x + dx * progress;
    const col = Math.round(x);

    path.push(w.row[y][col]);
  }

  return path;
};
const fireBow = (tile) => {
  const bow = document.getElementById("bow");
  const ammo = document.getElementById("ammo");

  const magazineElm = document.getElementById("magazine");
  if (w.magazine > 0) {
    document.getElementById("ammo").innerHTML = "";
    bow.classList.add("fire");
    makeCornProjectile(ammo, tile.elm);

    const path = getProjectilePath(w.row[29][8], tile);
    console.log(path, path.length);
    path.forEach((t) => {
      t.elm.classList.add("hit");
      damageTile(t, w.damage);
      setTimeout(() => {
        t.elm.classList.remove("hit");
      }, w.tickIntval * 0.2);
    });

    if (magazineElm.lastChild) {
      magazineElm.removeChild(magazineElm.lastChild);
    }

    setTimeout(() => {
      bow.classList.remove("fire");

      if (w.magazine > 0) {
        document.getElementById("ammo").appendChild(newDiv("cornP"));
      }
    }, w.tickIntval * 0.2);

    w.magazine--;
  } else {
    if (w.corn >= 10) {
      adjustValue(-10, "corn");
      w.magazine = 10;
    } else if (w.corn > 0) {
      w.magazine = w.corn;
      adjustValue(0 - w.corn, "corn");
    } else if (w.corn <= 0) {
      gameOver("You ran out of corn!");
    }
    reload();
  }
};

const triggerRetreat = (tile) => {
  console.log("Retreat triggered", tile);
};

boot();
