Here is our crap collision code in case everything dies

function checkCollisions() {
  for (var gx = 0; gx < numHorzBars+1; gx++) {
    var checkR = x + sizeX/2 >= canvas.width - (x%(canvas.width/(numHorzBars))+gx*canvas.width/numHorzBars + canvas.width/(2*numHorzBars)) && x + sizeX/2 <= canvas.width - (x%(canvas.width/(numHorzBars))+gx*canvas.width/numHorzBars);
    var checkL = x - sizeX/2 >= canvas.width - (x%(canvas.width/(numHorzBars))+gx*canvas.width/numHorzBars + canvas.width/(2*numHorzBars)) && x - sizeX/2 <= canvas.width - (x%(canvas.width/(numHorzBars))+gx*canvas.width/numHorzBars);

    if (checkR || checkL) {
      for (var gy = 1; gy < numVertBars; gy++) {
        if (dy > 0 && y >= canvas.height - (gy*(canvas.height/numVertBars)) - gridSize - sizeY && y <= canvas.height - (gy*(canvas.height/numVertBars)) - sizeY) {
          console.log("up intersect");
          dy = 0;
        }
        if (y >= canvas.height - (gy*(canvas.height/numVertBars)) - gridSize - sizeY && y <= canvas.height - (gy*(canvas.height/numVertBars))) {
          console.log("up intersect");
          dy = 0;
          if (rPress) dx = -0.2;
          if (lPress) dx = 0.2;
          if (!rPress && !lPress) dx = 0;
        }
      }
    }
  }
