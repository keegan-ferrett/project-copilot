import "dotenv/config";
import React from "react";
import { render } from "ink";
import App from "./App.js";
import { runCli } from "./cli.js";

const handled = await runCli(process.argv.slice(2));

if (!handled) {
  render(React.createElement(App));
}
