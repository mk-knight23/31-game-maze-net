export function generateMaze(size: number) {
  const maze = Array(size).fill(0).map(() => Array(size).fill(1));
  const stack = [[1, 1]];
  maze[1][1] = 0;

  while (stack.length > 0) {
    const [x, y] = stack[stack.length - 1];
    const neighbors = [];

    if (x > 2 && maze[x - 2][y] === 1) neighbors.push([-2, 0]);
    if (x < size - 3 && maze[x + 2][y] === 1) neighbors.push([2, 0]);
    if (y > 2 && maze[x][y - 2] === 1) neighbors.push([0, -2]);
    if (y < size - 3 && maze[x][y + 2] === 1) neighbors.push([0, 2]);

    if (neighbors.length > 0) {
      const [dx, dy] = neighbors[Math.floor(Math.random() * neighbors.length)];
      maze[x + dx][y + dy] = 0;
      maze[x + dx / 2][y + dy / 2] = 0;
      stack.push([x + dx, y + dy]);
    } else {
      stack.pop();
    }
  }

  // Create Exit
  maze[size - 1][size - 2] = 0;
  return maze;
}
