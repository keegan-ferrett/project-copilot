import "dotenv/config";
import React from "react";
import { render } from "ink";
import App from "./App.js";
import { runCli } from "./cli.js";

const result = await runCli(process.argv.slice(2));

if (result !== true) {
  render(
    React.createElement(App, {
      projectName: result.projectName,
      systemPromptPath: result.systemPromptPath,
    }),
  );
}
