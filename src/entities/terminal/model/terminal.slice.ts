import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TerminalState {
  logs: string[];
}

const initialState: TerminalState = {
  logs: [
    "Welcome to CodeSandbox Terminal",
    "Type 'help' to see list of available commands",
    "",
    "$ npm run dev",
    "ready - started server on 0.0.0.0:3000, url: http://localhost:3000",
    "compiled successfully - ready in 1.2s",
  ],
};

const terminalSlice = createSlice({
  name: "terminal",
  initialState,
  reducers: {
    addLog(state, action: PayloadAction<string>) {
      state.logs.push(action.payload);
    },
    clearLogs(state) {
      state.logs = [];
    },
  },
});

export const { addLog, clearLogs } = terminalSlice.actions;
export const terminalReducer = terminalSlice.reducer;
