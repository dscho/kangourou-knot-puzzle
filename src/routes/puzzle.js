/*
 * Kangourou knot puzzle solver
 *
 * The Kangourou knot puzzle has 5 distinct pieces, in total 16 pieces.
 * These pieces have irregular shapes, even if they naturally fit
 * into a grid of tiles, where all except the first type of piece
 * has at least one side that aligns with the side of such a tile.
 *
 * The goal of the puzzle is to fit a given set of pieces into a
 * given shape. The pieces can be rotated, but not flipped.
 *
 * Note: To throw off the player, the shapes of the pieces are
 * deliberately irregular, even if each corner of each shape aligns
 * with a sub grid made up of the overall grid by subdividing each
 * tile into 4x4 small tiles.
 *
 * If it weren't necessary for stability, the edges that are at a 45°
 * angle could even be avoided and the corners would align on a larger
 * grid made by subdividing each tile into 2x2 small tiles instead.
 * However, in such a case many pieces would fall apart, with small
 * tiles being connected merely by their corners.
 *
 * Mathematically, however, these pieces _can_ be represented by those
 * 2x2 tiles, which is what we do here.
 *
 * In the following, each piece is identified by a bit mask that
 * corresponds to the 2x4 layout on a grid:
 *
 *  --   --   --   --   --       --
 * |  | |x | |xx| |x | |xx|     |01| (bits)
 * |x | |x | |x | |x | |x |     |23|
 * | x| | x| | x| | x| | x|     |45|
 * |  | |  | |  | | x| | x|     |67|
 *  --   --   --   --   --       --
 */
const Pos00 = 1<<0
const Pos01 = 1<<1
const Pos10 = 1<<2
const Pos11 = 1<<3
const Pos20 = 1<<4
const Pos21 = 1<<5
const Pos30 = 1<<6
const Pos31 = 1<<7

const pieces = [
                  Pos10 | Pos21,
  Pos00 |         Pos10 | Pos21,
  Pos00 | Pos01 | Pos10 | Pos21,
  Pos00 |         Pos10 | Pos21 | Pos31,
  Pos00 | Pos01 | Pos10 | Pos21 | Pos31,
].map(mask => {
  /**
   * Returns the bit at the given coordinate
   *
   * @param {Number} x
   * @param {Number} y
   * @returns {number}
   */
  const isSet = (x, y) => mask & (1 << (y * 2 + x)) ? 1 : 0
  // Each rotation is an array of bit masks, one per row,
  // lowest bit representing the upper-leftmost tile.
  const rotations = [
    [
      isSet(0, 0) | isSet(1, 0) << 1,
      isSet(0, 1) | isSet(1, 1) << 1,
      isSet(0, 2) | isSet(1, 2) << 1,
      isSet(0, 3) | isSet(1, 3) << 1,
    ], [
      isSet(1, 0) | isSet(1, 1) << 1 | isSet(1, 2) << 2 | isSet(1, 3) << 3,
      isSet(0, 0) | isSet(0, 1) << 1 | isSet(0, 2) << 2 | isSet(0, 3) << 3,
    ], [
      isSet(1, 3) | isSet(0, 3) << 1,
      isSet(1, 2) | isSet(0, 2) << 1,
      isSet(1, 1) | isSet(0, 1) << 1,
      isSet(1, 0) | isSet(0, 0) << 1,
    ], [
      isSet(0, 3) | isSet(0, 2) << 1 | isSet(0, 1) << 2 | isSet(0, 0) << 3,
      isSet(1, 3) | isSet(1, 2) << 1 | isSet(1, 1) << 2 | isSet(1, 0) << 3,
    ]
  ].map(row => row.map(mask => BigInt(mask)))
  let tileCount = 0
  for (let i = 0; i < 8; i++) {
    if (mask & (1 << i)) tileCount++
  }
  return {
    rotations,
    tileCount
  }
})

export class KangourouKnotPuzzle {
  /**
   *
   * @param {Number|String} widthOrBoard
   * @param {Number} [height]
   * @param {Number[][]} [tileCoordinates]
   */
  constructor(widthOrBoard, height, tileCoordinates) {
    if (typeof widthOrBoard === 'string') {
      this.board = widthOrBoard
      // Interpret the only parameter as an ASCII representation of the puzzle, e.g.
      // "XX\nXX" for 2x2 (big) tiles needing to be covered
      const lines = widthOrBoard.split('\n')
      this.width = lines.reduce((max, line) => Math.max(max, line.length), 0)
      this.height = lines.length
      tileCoordinates = lines.reduce((/** @type Number[][] */ a, line, y) =>
        line.split('').reduce((a, c, x) => {
          if (c !== ' ') a.push([x, y])
          return a
        }, a), [])
    } else if (typeof widthOrBoard === 'number') {
      if (typeof height !== 'number' || tileCoordinates === undefined) throw new Error('Invalid parameters')
      this.width = widthOrBoard
      this.height = height
      this.board = tileCoordinates.reduce((board, xy) => {
        const [x, y] = xy
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) board[y][x] = 'X'
        return board
      }, Array(height).fill('').map(() => Array(widthOrBoard).fill(' ')))
      .map(row => row.join('')).join('\n')
    } else throw new Error('Invalid parameters')
    this.mask = BigInt(0)
    this.tileCount = 0
    tileCoordinates.forEach(xy => {
      const [x, y] = xy
      const p = 4 * y * this.width + 2 * x
      if (this.mask & (1n << BigInt(p))) {
        console.warn(`${x}, ${y} is already set`)
        return
      }
      this.mask |= 1n << BigInt(p)
      this.mask |= 1n << BigInt(p + 1)
      this.mask |= 1n << BigInt(p + 2 * this.width)
      this.mask |= 1n << BigInt(p + 2 * this.width + 1)
      this.tileCount += 4
    })

    /* Depends on the width of the board */
    this.pieces = pieces.map(piece => {
      const rotations = piece.rotations.map(
        rotation => rotation.reduce(
          (s, m, index) =>
            s | (m << BigInt(2 * index * this.width)),
          0n
        )
      )
      if (rotations[0] === rotations[2]) rotations.splice(2, 2)
      return {
        rotations
      }
    })
  }

  /**
   *
   * @param {Number[]} [pieceCounts]
   * @returns {Number[][][]}
   */
  solve(pieceCounts) {
    if (pieceCounts) {
      const pieceCountTotal = pieceCounts.reduce((count, pieceCount, index) => count + pieceCount * pieces[index].tileCount, 0)
      if (this.tileCount !== pieceCountTotal) {
        console.warn(`${this.tileCount} tiles need to be covered, but the pieces cover ${pieceCountTotal}`)
        return []
      }
    } else pieceCounts = [2, 6, 4, 2, 2]
    /**@type {Number[][][]} */
    const solutions = []
    this.solve0({
      pieceCounts,
      s: 0n,
      moves: [],
      solutions
     }, 0, 0)
     return solutions
  }

  /**
   *
   * @param {bigint} s
   * @param {Number} x
   * @param {Number} y
   * @returns {boolean}
   */
  isComplete(s, x, y) {
    const p = 4 * y * this.width + 2 * x
    const mask =
      1n << BigInt(p)
      | 1n << BigInt(p + 1)
      | 1n << BigInt(p + 2 * this.width)
      | 1n << BigInt(p + 2 * this.width + 1)
    return (s & mask) === mask
  }

  /**
   * Tests whether the given tile is empty
   *
   * @param {Number} x
   * @param {Number} y
   * @returns {boolean}
   */
  isEmpty(x, y) {
    return (this.mask & (1n << BigInt(4 * y * this.width + 2 * x))) === 0n
  }

  /**
   * Recursive solver
   *
   * @param {{
   *  pieceCounts: Number[],
   *  s: bigint,
   *  moves: Number[][],
   *  solutions: Number[][][]
   * }} state
   * @param {Number} x
   * @param {Number} y
   * @returns {boolean}
   */
  solve0(state, x, y) {
    if (x >= this.width) return this.solve0(state, 0, y + 1)
    if (y >= this.height) return true
    if (this.isEmpty(x, y) || this.isComplete(state.s, x, y)) return this.solve0(state, x + 1, y)

    // If the last move was at the same coordinates, we can skip
    // the piece/rotation that was tried already
    const latestMove = state.moves[state.moves.length - 1]
    const sameCoords = latestMove?.[0] === x && latestMove?.[1] === y ? latestMove : null
    for (let i = sameCoords?.[2] || 0; i < this.pieces.length; i++) {
      if (state.pieceCounts[i] === 0) continue
      for (let j = sameCoords?.[2] === i ? sameCoords[3] : 0; j < this.pieces[i].rotations.length; j++) {
        const rotation = this.pieces[i].rotations[j]
        const mask = rotation << BigInt(4 * y * this.width + 2 * x)
        if (state.s & mask) continue
        if (mask & ~this.mask) continue

        state.pieceCounts[i]--
        state.s |= mask
        state.moves.push([x, y, i, j])
        if (this.solve0(state, x, y)) {
          state.solutions.push([...state.moves])
        }
        state.pieceCounts[i]++
        state.s &= ~mask
        state.moves.pop()
      }
    }
    return false
  }

  /**
   *
   * @param {Number[][]} solution
   * @param {boolean} useColor
   * @returns {string}
   */
  solutionToString(solution, useColor) {
    const width = this.width
    const height = this.height
    const grid = Array.from(
      { length: 2 * height },
      () => Array.from({ length: 2 * width }, () => ' ')
    )

    const labels = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const colors = [
      '\x1b[42m',   // background green
      '\x1b[1;34m', // bold blue
      '\x1b[35m',   // magenta
      '\x1b[36m',   // cyan
      '\x1b[1;41m', // background red
    ]
    let nr = 0
    for (const move of solution) {
      const [x, y, i, j] = move
      const label = useColor ? `${colors[i]}${labels[nr++]}\x1b[m` : labels[nr++]
      const row = pieces[i].rotations[j]
      for (let dy = 0; dy < row.length; dy++) {
        const mask = row[dy]
        for (let dx = 0, shift = 1n; shift <= mask; dx++, shift <<= 1n) {
          if (mask & shift) grid[2 * y + dy][2 * x + dx] = label
        }
      }
    }

    return grid.map(row => row.join('')).join('\n')
  }

  /**
   * Generate an SVG image for the given solution (or gray tiles from the current board)
   *
   * @param {Number[][]} solution
   * @returns {string}
   */
  solutionToSVG(solution) {
    return KangourouKnotPuzzle.toSVG({
      width: this.width,
      height: this.height,
      board: solution ? undefined : this.board,
      solution: !solution ? undefined : solution
    })
  }

  /**
   * Generate an SVG image from the given options
   *
   * @param {{
   *   width: Number,
   *   height: Number,
   *   board?: string,
   *   solution?: Number[][]
   * }} options
   * @returns {string}
   */
  static toSVG(options) {
    return `data:image/svg+xml;utf8,<svg
      xmlns:xlink='http://www.w3.org/1999/xlink'
      xmlns='http://www.w3.org/2000/svg'
      width='${options.width}'
      height='${options.height}'
      >
      <style>${!options.solution ? '' : `
        path.S {
          fill: none;
          stroke-linecap: butt;
          stroke-opacity: 1;
          paint-order: normal;
        }
        path.outline {
          fill: %23000000;
          stroke: %23ffffff;
          stroke-width: 0.1;
        }`}
      </style>
      <defs>
        ${!options.solution ? '' : `${Array(5).fill(0).map((_, i) => `
          <path id='outline${i}' class='outline' d='M 0,8 ${
            i == 0 ? '0,6 2,4' : (i % 2) === 1 ? '0,0 2,0 4,2' : '0,0 8,0 8,2 6,4'
          } 4,4 4,6 6,8 8,8 ${
            i < 3 ? '8,10 6,12 4,12' : '8,16 6,16 4,14'
          } 4,10 2,8 Z' />
          <clipPath id='clip${i}'><use xlink:href='%23outline${i}' /></clipPath>
          <path id='S${i}-path' class='S' d='M ${
            i == 0 ? '1,5 L' : `${
              (i % 2) === 1 ? '3,1 C 2,2 0,4' : '7,3 C 3,-1 -1,3'
            } 3,7 4,8 4,8`
          } ${i <3 ? '7,11' : '5,9 8,12 6,14 5,15'}' />
          <g id='S${i}0' clip-path='url(%23clip${i})' transform='scale(0.125)'>
            <use xlink:href='%23outline${i}' />
            <use xlink:href='%23S${i}-path' style='stroke:%231500ce;stroke-width:2.5;' />
            <use xlink:href='%23S${i}-path' style='stroke:%23000000;stroke-width:1.5;' />
            <use xlink:href='%23S${i}-path' style='stroke:%2300009d;stroke-width:1.0;' />
            <use xlink:href='%23outline${i}' style='fill-opacity:0;' />
          </g>
          <use id='S${i}1' xlink:href='%23S${i}0' transform='rotate(-90,0.5,0.5)' />
          <use id='S${i}2' xlink:href='%23S${i}0' transform='rotate(180,0.5,1)' />
          <use id='S${i}3' xlink:href='%23S${i}0' transform='rotate(90,1,1)' />`).join('')
        }`}
      </defs>${options.solution
        ? options.solution.map(move => `
        <use xlink:href='%23S${move[2]}${move[3]}' x='${move[0]}' y='${move[1]}' />`).join('')
        : KangourouKnotPuzzle.boardOutlineAsSVG({
           width: options.width,
           height: options.height,
           grid: true,
           board: options.board || ''
        })}
    </svg>`
  }

  /**
   * Determines the outline of the indicated board, and returns it in the form of SVG paths
   *
   * @param {{
   *   width: Number,
   *   height: Number,
   *   board: string,
   *   grid?: boolean
   * }} options
   * @returns {string}
   */
  static boardOutlineAsSVG(options) {
    /** @type {string[]} */
    const paths = []

    // These 2d arrays keep track of lines already drawn
    const horizontal = Array(2 * options.height + 1).fill(0).map(() => Array(options.width).fill(false))
    const vertical = Array(options.height).fill(0).map(() => Array(2 * options.width + 1).fill(false))

    /*
     * The board is a 2d array, corresponding to the coordinates of the upper left corner of each tile,
     * mapping to `true` if there is a tile, `false` if there is none.
     */
    const board = options.board.split('\n').map(row => row.split('').map(cell => cell === 'X'))
    const directions = [{
      name: 'right', dx: 1, dy: 0, px: 0, py: 0,
    }, {
      name: 'down', dx: 0, dy: 1, px: -1, py: 0,
    }, {
      name: 'left', dx: -1, dy: 0, px: -1, py: -1,
    }, {
      name: 'up', dx: 0, dy: -1, px: 0, py: -1,
    }]

    /**
     * Tests whether the given cell is inside the board
     *
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    const isInside = (x, y) => x >= 0 && x < options.width && y >= 0 && y < options.height && board[y][x]
    /**
     * Tests whether going in the given direction would follow the outline of the board
     *
     * @param {number} x
     * @param {number} y
     * @param {number} direction
     * @returns {boolean}
     */
    const followsOutline = (x, y, direction) =>
      isInside(
        x + directions[direction].px,
        y + directions[direction].py
      ) && !isInside(
        x + directions[direction].dx + directions[(direction + 2) % 4].px,
        y + directions[direction].dy + directions[(direction + 2) % 4].py
      )

    const lineWidth = 0.02
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (!cell) return

        if (options.grid) {
          if (!vertical[y][2 * x + 1]) {
            let y0 = y + 1
            while (isInside(x, y0)) vertical[y0++][2 * x + 1] = true
            paths.push(`<path style="fill: none; stroke: %23000000; stroke-width: ${lineWidth / 2}; stroke-dasharray: ${lineWidth * 1},${lineWidth * 1};" d="M ${x + 0.5},${y} L ${x + 0.5},${y0}" />`)
          }

          if (!horizontal[2 * y + 1][x]) {
            let x0 = x + 1
            while (isInside(x0, y)) horizontal[2 * y + 1][x0++] = true
            paths.push(`<path style="fill: none; stroke: %23000000; stroke-width: ${lineWidth / 2}; stroke-dasharray: ${lineWidth * 1},${lineWidth * 1};" d="M ${x},${y + 0.5} L ${x0},${y + 0.5}" />`)
          }
        }

        if (!vertical[y][2 * x] && !followsOutline(x, y + 1, 3)) {
          let y0 = y + 1
          while (isInside(x, y0) && isInside(x - 1, y0)) vertical[y0++][2 * x] = true
          paths.push(`<path style="fill: none; stroke: %23000000; stroke-width: ${lineWidth / 2};" d="M ${x},${y} L ${x},${y0}" />`)
        }

        if (!horizontal[2 * y][x]) {
          // Check for outline
          if (!followsOutline(x, y, 0)) {
            // Nope, not an outline.
            let x0 = x + 1
            while (isInside(x0, y) && isInside(x0, y - 1)) horizontal[2 * y][x0++] = true
            paths.push(`<path style="fill: none; stroke: %23000000; stroke-width: ${lineWidth / 2};" d="M ${x},${y} L ${x0},${y}" />`)
            return
          }

          // This tile is an upper-left corner, otherwise we would have drawn the line already
          const path = [`<path style="fill: none; stroke: %23000000; stroke-width: ${lineWidth};" d="M ${x + lineWidth / 2},${y + lineWidth / 2}`]
          let x0 = x + 1
          let y0 = y
          let direction = 0 // start looking right
          let clockwise = 0
          // Trace the outline
          for (;;) {
            let previousDirection = direction
            for (;;) {
              const turnLeft = (direction + 3) % 4
              if (followsOutline(x0, y0, turnLeft)) {
                direction = turnLeft
                clockwise--
                break
              }
              if (!followsOutline(x0, y0, direction)) {
                direction = (direction + 1) % 4
                clockwise++
                break
              }
              if (direction === 0) horizontal[2 * y0][x0] = true
              else if (direction === 1) vertical[y0][2 * x0] = true
              else if (direction === 2) horizontal[2 * y0][x0 - 1] = true
              else if (direction === 3) vertical[y0 - 1][2 * x0] = true
              x0 += directions[direction].dx
              y0 += directions[direction].dy
            }
            if (x0 === x && y0 === y) {
              if (clockwise < 0) {
                path[0] = path[0].replace(
                  `M ${x + lineWidth / 2},${y + lineWidth / 2}`,
                  `M ${x - lineWidth / 2},${y + lineWidth / 2}`
                )
              }
              path.push(`Z" />`)
              paths.push(path.join(' '))
              break
            }
            path.push(`L ${
              x0+(directions[(previousDirection + 1) % 4].dx + directions[(direction + 1) % 4].dx) * lineWidth / 2
            },${
              y0+(directions[(previousDirection + 1) % 4].dy + directions[(direction + 1) % 4].dy) * lineWidth / 2
            }`)
          }
        }
      })
    })

    return paths.map(e => `    ${e}`).join('\n')
  }
}

if (typeof process !== 'undefined' && import.meta?.url?.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  // const p = new KangourouKnotPuzzle(2, 2, [[0, 0], [1, 0], [0, 1], [1, 1]])
  // console.log(p.solve([0, 0, 4, 0, 0]))
  // const p = new KangourouKnotPuzzle(4, 4, [[1, 0], [2, 0], [3, 0], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [0, 3], [1, 3], [2, 3]])
  // const p = new KangourouKnotPuzzle(' XXX\n XXX\nXXX \nXXX ')
  // const solutions = p.solve([2, 6, 4, 0, 2])
  // const p = new KangourouKnotPuzzle(' XXX\n X X\nXX XX\nXXXXX')
  // const solutions = p.solve([2, 6, 4, 2, 2])
  // const p = new KangourouKnotPuzzle('XXX\nX X\nXXX\nXXX')
  // const solutions = p.solve([1, 4, 3, 2, 2])
  const p = new KangourouKnotPuzzle('XXXXXX\nXXXXXX')
  //const solutions = p.solve([2, 6, 4, 0, 2])
  const solutions = p.solve()
  console.log(solutions)
  for (const s of solutions) {
    console.log(`Solution:\n${p.solutionToString(s, true)}`)
  }
}
