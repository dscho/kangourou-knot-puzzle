<script>
  import { KangourouKnotPuzzle } from './puzzle.js';

  let board = $state('XX  \nXXXX\n XXX\n XXX')
  let puzzle = $derived(new KangourouKnotPuzzle(board))
  let solutions = $derived(puzzle.solve()
    .map((solution) => {
      return {
        solution,
        pieceCount: solution.reduce((pieceCount, move) => {
          pieceCount[move[2]]++
          return pieceCount
        }, [0, 0, 0, 0, 0])
      }
    })
    .sort((a, b) => a.pieceCount.join('').localeCompare(b.pieceCount.join('')))
  )
  let solutionIndex = $state(0)
  let S_svg = $derived(puzzle.solutionToSVG(solutions[solutionIndex]?.solution))

  /**
   *
   * @param {Number} coordinateInPixels
   * @param {Number} dimensionInTiles
   * @param {Number} dimensionInPixels
   * @returns Number
   */
  function round(coordinateInPixels, dimensionInTiles, dimensionInPixels) {
    const roundedDown = Math.floor(coordinateInPixels * dimensionInTiles / dimensionInPixels)
    const diff = coordinateInPixels - roundedDown * dimensionInPixels / dimensionInTiles
    return diff < 5 || diff > dimensionInPixels / dimensionInTiles - 5 ? -1 : roundedDown
  }

  /**
   *
   * @param {PointerEvent & { currentTarget: EventTarget & HTMLImageElement } } event
   */
  function onpointerup(event) {
    const x = round(
      event.clientX - event.currentTarget.offsetLeft,
      board.indexOf('\n'),
      event.currentTarget.width
    )
    const y = round(
      event.clientY - event.currentTarget.offsetTop,
      board.split('\n').length,
      event.currentTarget.height
    )
    if (x >= 0 && y >= 0) {
      const row = board.split('\n')[y]
      const newRow = row.substring(0, x) + (row[x] === ' ' ? 'X' : ' ') + row.substring(x + 1)
      board = board.split('\n').map((r, i) => i === y ? newRow : r).join('\n')
      solutionIndex = 0
    }
  }
</script>

<main class="container">
  <h1>Kangourou Knot Puzzle</h1>

  <center>
    <img class="S" src="{S_svg}" alt="S" {onpointerup} />
  </center>
</main>

<div class="side">
  {#if solutions.length === 0}
    <p>
      No solutions found.
    </p>
  {:else}
    <p>
      {solutions.length} solution{#if solutions.length > 1}s{/if} found.
    </p>
    <ul>
      {#each solutions as { pieceCount, solution }, i}
        {#if i === 0 || solutions[i - 1].pieceCount.join('') !== pieceCount.join('')}
          <li class="piece-count">
            <strong>{pieceCount.join('')}</strong>
          </li>
        {/if}
        <li class={i === solutionIndex ? 'selected' : ''}>
          <button onclick={() => solutionIndex = i}>
            {i + 1}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
img.S {
  width: 640px;
}

:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;

  color: #0f0f0f;
  background-color: #f6f6f6;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

.container {
  margin: 0;
  padding-top: 10vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.side {
  position: fixed;
  top: 10ex;
  left: 5em;
  padding: 1em;
}

.side li {
  list-style-type: none;
}

li.piece-count {
  margin-top: 1em;
}

li.selected {
  background-color: #f6f6f6;
  list-style-type: square;
}

h1 {
  text-align: center;
}

@media (prefers-color-scheme: dark) {
  :root {
    color: #f6f6f6;
    background-color: #2f2f2f;
  }
}

</style>
