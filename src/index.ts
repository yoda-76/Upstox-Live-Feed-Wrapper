import express from "express";
import { Express, Request, Response } from "express";

// import { router } from "./router";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { Socket } from "node:dgram";
import { SocketStore } from "./socketStore";


let upstoxWS: any;


const app = express();
const server = createServer(app);
app.use(express.json());

app.post("/market-feed-init", async (req:Request, res:Response)=>{
    try{
        const socketStore = await SocketStore.getInstance(req.body.access_token);
        // res.send("success");
        const isSocketRunning = await socketStore.getUpstoxWs();
        if(isSocketRunning) res.send("success");
        else res.status(500).send("error while initializing market feed")
        
    }catch(error){
        console.log("error123")
        res.status(500).send("error while initializing market feed")
    }
})

app.post("/subscribe", async (req:Request, res:Response)=>{
    try{
        const instrumentKeys = req.body.instrumentKeys;
        const socketStore = SocketStore.getInstance();
        await socketStore.subscribeTokens(instrumentKeys);
        res.send("success")
    }catch(error){
        console.log(error)
    }
})
app.listen(3001, () => {
    console.log("Server is running on port 3000");
});

export const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });
  
  io.on("connection", (socket) => {
    console.log("new connection");
  
    socket.on("new-user", (data) => {
      console.log(data);
    });
  });