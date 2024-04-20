// GW-CANVAS: rollup.config.js

import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default [
  {
    input: "dist/index.js",
    plugins: [nodeResolve(), commonjs()],
    output: [
      {
        file: "dist/gw-app.min.js",
        format: "umd",
        name: "GWA",
        // freeze: false,
        // extend: true,
        sourcemap: true,
        plugins: [terser()],
      },
      {
        file: "dist/gw-app.mjs",
        format: "es",
        // freeze: false,
        sourcemap: true,
      },
      {
        file: "dist/gw-app.js",
        format: "umd",
        name: "GWA",
        // freeze: false,
        // extend: true,
        sourcemap: true,
      },
    ],
  },
  {
    input: "dist/index.d.ts",
    output: [{ file: "dist/gw-app.d.ts", format: "es" }],
    plugins: [dts()],
  },
];
