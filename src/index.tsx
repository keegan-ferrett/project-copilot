import "dotenv/config";
import React from "react";
import { render } from "ink";
import App from "./App.js";
import { runCli } from "./cli.js";

const options = runCli(process.argv.slice(2));

render(
  React.createElement(App, {
    systemPromptPath: options.systemPromptPath,
  }),
);
