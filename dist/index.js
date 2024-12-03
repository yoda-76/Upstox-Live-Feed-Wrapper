"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
// import { router } from "./router";
const socket_io_1 = require("socket.io");
const node_http_1 = require("node:http");
const socketStore_1 = require("./socketStore");
let upstoxWS;
const app = (0, express_1.default)();
const server = (0, node_http_1.createServer)(app);
app.use(express_1.default.json());
app.post("/market-feed-init", async (req, res) => {
    try {
        await socketStore_1.SocketStore.getInstance(req.body.access_token);
        res.send("success");
    }
    catch (error) {
        console.log(error);
    }
});
app.post("/subscribe", async (req, res) => {
    try {
        const instrumentKeys = req.body.instrumentKeys;
        const socketStore = socketStore_1.SocketStore.getInstance();
        await socketStore.subscribeTokens(instrumentKeys);
        res.send("success");
    }
    catch (error) {
        console.log(error);
    }
});
app.listen(3001, () => {
    console.log("Server is running on port 3000");
});
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
exports.io.on("connection", (socket) => {
    console.log("new connection");
    socket.on("new-user", (data) => {
        console.log(data);
    });
});
