<script>
  import { KangourouKnotPuzzle } from './puzzle.js';

  const p = new KangourouKnotPuzzle(' XXX\n XXX\nXXX \nXXX ')
  const solutions = p.solve([2, 6, 4, 0, 2])

  const S_svg = `data:image/svg+xml;utf8,<svg
    xmlns:xlink='http://www.w3.org/1999/xlink'
    xmlns='http://www.w3.org/2000/svg'
    width='${p.width}'
    height='${p.height}'
    >
    <style>
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
      }
    </style>
    <defs>
      ${Array(5).fill(0).map((_, i) => `
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
      }
    </defs>${solutions[0].map(move => `
      <use xlink:href='%23S${move[2]}${move[3]}' x='${move[0]}' y='${move[1]}' />`).join('')}
  </svg>`
</script>

<main class="container">
  <h1>Kangourou Knot Puzzle</h1>

  <center>
    <img class="S" src="{S_svg}" alt="S" />
  </center>
</main>

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
