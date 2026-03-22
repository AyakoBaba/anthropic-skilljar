import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationLabel } from "../ToolInvocationLabel";

afterEach(() => {
  cleanup();
});

test("shows 'Creating' for str_replace_editor create command", () => {
  render(
    <ToolInvocationLabel
      tool={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor str_replace command", () => {
  render(
    <ToolInvocationLabel
      tool={{
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/Card.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Editing /Card.jsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor insert command", () => {
  render(
    <ToolInvocationLabel
      tool={{
        toolName: "str_replace_editor",
        args: { command: "insert", path: "/utils.js" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Editing /utils.js")).toBeDefined();
});

test("shows 'Viewing' for str_replace_editor view command", () => {
  render(
    <ToolInvocationLabel
      tool={{
        toolName: "str_replace_editor",
        args: { command: "view", path: "/App.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Viewing /App.jsx")).toBeDefined();
});

test("shows 'Undoing edit to' for undo_edit command", () => {
  render(
    <ToolInvocationLabel
      tool={{
        toolName: "str_replace_editor",
        args: { command: "undo_edit", path: "/App.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Undoing edit to /App.jsx")).toBeDefined();
});

test("shows 'Renaming' for file_manager rename command", () => {
  render(
    <ToolInvocationLabel
      tool={{
        toolName: "file_manager",
        args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Renaming /old.jsx → /new.jsx")).toBeDefined();
});

test("shows 'Deleting' for file_manager delete command", () => {
  render(
    <ToolInvocationLabel
      tool={{
        toolName: "file_manager",
        args: { command: "delete", path: "/temp.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Deleting /temp.jsx")).toBeDefined();
});

test("falls back to toolName for unknown tools", () => {
  render(
    <ToolInvocationLabel
      tool={{
        toolName: "unknown_tool",
        args: {},
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("shows spinner when state is not result", () => {
  const { container } = render(
    <ToolInvocationLabel
      tool={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      }}
    />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
});

test("shows green dot when state is result", () => {
  const { container } = render(
    <ToolInvocationLabel
      tool={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("handles missing path gracefully", () => {
  render(
    <ToolInvocationLabel
      tool={{
        toolName: "str_replace_editor",
        args: { command: "create" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Creating")).toBeDefined();
});
