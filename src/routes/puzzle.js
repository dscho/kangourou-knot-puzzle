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
  constructor(widthOrBoard, height, tileCoordinates) {
    if (typeof widthOrBoard === 'string') {
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

  solve(pieceCounts) {
    const pieceCountTotal = pieceCounts.reduce((count, pieceCount, index) => count + pieceCount * pieces[index].tileCount, 0)
    if (this.tileCount !== pieceCountTotal) {
      console.warn(`${this.tileCount} tiles need to be covered, but the pieces cover ${pieceCountTotal}`)
      return false
    }
    const solutions = []
    this.solve0({
      pieceCounts,
      s: 0n,
      moves: [],
      solutions
     }, 0, 0)
     return solutions
  }

  isComplete(s, x, y) {
    const p = 4 * y * this.width + 2 * x
    const mask =
      1n << BigInt(p)
      | 1n << BigInt(p + 1)
      | 1n << BigInt(p + 2 * this.width)
      | 1n << BigInt(p + 2 * this.width + 1)
    return (s & mask) === mask
  }

  isEmpty(x, y) {
    return (this.mask & (1n << BigInt(4 * y * this.width + 2 * x))) === 0n
  }

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
  const solutions = p.solve([2, 6, 4, 0, 2])
  console.log(solutions)
  for (const s of solutions) {
    console.log(`Solution:\n${p.solutionToString(s, true)}`)
  }
}
