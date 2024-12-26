import { io } from ".";
import Redis from "ioredis";

const redisClient = new Redis(
  "rediss://default:AeQcAAIjcDE0MjMyYTMzNDEwYzc0Y2ZiOWFkMzk1M2JlZTgwM2IwMHAxMA@helpful-polliwog-58396.upstash.io:6379"
);
//redisClient2 will connect to default port
const redisClient2 = new Redis(
    "redis://127.0.0.1:6379"
)
// import { initializeMarketFeed, io } from ".";
var UpstoxClient = require("upstox-js-sdk");
const WebSocket = require("ws").WebSocket;
const protobuf = require("protobufjs");

// const socketAccessToken="eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiJLTDI3NzAiLCJqdGkiOiI2NzQ2ZDg1MDU4Y2Q2NzM1N2IzMjY2NTAiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaWF0IjoxNzMyNjk2MTQ0LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3MzI3NDQ4MDB9.kzn4naH8DRTcHqt4QGwRTMujronP_a-JGz68Lurgqv4";

let keysData:string[];
  let protobufRoot:any = null;
  let defaultClient = UpstoxClient.ApiClient.instance;
  let apiVersion = "2.0";
  let OAUTH2 = defaultClient.authentications["OAUTH2"];

export class SocketStore {
    public static upstoxWs: any; // Singleton WebSocket instance
    private static instance: SocketStore;
    private static isInitialized = false; // To track WebSocket initialization
    private static subscribedTokens: Set<string> = new Set(); // Keep track of subscribed tokens
    private static access_token = "";

    public static getInstance(access_token?:string): SocketStore {
        try {
            if (!SocketStore.instance) {
                if(!access_token) throw Error("No access token is provided!")
                SocketStore.instance = new SocketStore();
                SocketStore.access_token=access_token;
            }
            return SocketStore.instance;
        } catch (error) {
            console.log(error);
            throw new Error(`Error initializing SocketStore: ${error}`);
        }
    }

    public async socketRunning() {
        return SocketStore.privateSocketRunning();
    }
    private static privateSocketRunning() {
        return this.isInitialized
    }
    private constructor() {
        if (!SocketStore.isInitialized) {
            SocketStore.initializeMarketFeed();
        }
    }

    public  async getUpstoxWs() {
        if (!SocketStore.upstoxWs || SocketStore.upstoxWs.readyState !== WebSocket.OPEN) {
            SocketStore.upstoxWs = await SocketStore.initializeMarketFeed();
        }
        return SocketStore.upstoxWs;
    }

    public async subscribeTokens(instrumentKeys: string[]) {
        const socketStore = SocketStore.getInstance();
        const ws = await socketStore.getUpstoxWs();
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.error("WebSocket is not open. Cannot subscribe to tokens.");
            return;
        }

        // Filter out already subscribed tokens
        const newTokens = instrumentKeys.filter(token => !SocketStore.subscribedTokens.has(token));
        if (newTokens.length === 0) {
            console.log("All tokens are already subscribed.");
            return;
        }

        const subscriptionMessage = {
            guid: "someguid",
            method: "sub",
            data: {
                mode: "ltpc",
                instrumentKeys: newTokens,
            },
        };

        try {
            ws.send(Buffer.from(JSON.stringify(subscriptionMessage)));
            newTokens.forEach(token => SocketStore.subscribedTokens.add(token));
            console.log(`Subscribed to new tokens: ${newTokens}`);
        } catch (error) {
            console.error("Failed to send subscription message:", error);
        }
    }

    private static async getMarketFeedUrl() {
        OAUTH2.accessToken = this.access_token;
        return new Promise<string>((resolve, reject) => {
            const apiInstance = new UpstoxClient.WebsocketApi();
            apiInstance.getMarketDataFeedAuthorize(apiVersion, (error:any, data:any) => {
                if (error) reject(error);
                else resolve(data.data.authorizedRedirectUri);
            });
        });
    }

    private static async connectWebSocket(io: any, wsUrl: string) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(wsUrl, {
                headers: {
                    "Api-Version": apiVersion,
                    Authorization: `Bearer ${OAUTH2.accessToken}`,
                },
                followRedirects: true,
            });

            ws.on("open", () => {
                console.log("WebSocket connected.");
                resolve(ws);
            });

            ws.on("close", () => {
                console.log("WebSocket disconnected.");
                SocketStore.isInitialized = false; // Reset initialization status
            });

            ws.on("message", (data: any) => {
                const parsedData = JSON.stringify(this.decodeProtobuf(data));
                // console.log(parsedData);
                redisClient2.publish("market-data", parsedData);
                io.emit("market-data", JSON.parse(parsedData));
            });

            ws.on("error", (error: Error) => {
                console.error("WebSocket error:", error);
                reject(error);
            });
        });
    }

    private static async initProtobuf() {
        protobufRoot = await protobuf.load(__dirname + "/MarketDataFeed.proto");
        console.log("Protobuf initialized.");
    }

    private static decodeProtobuf(buffer: Buffer) {
        if (!protobufRoot) {
            console.warn("Protobuf not initialized.");
            return null;
        }

        const FeedResponse = protobufRoot.lookupType(
            "com.upstox.marketdatafeeder.rpc.proto.FeedResponse"
        );
        return FeedResponse.decode(buffer);
    }

    private static async initializeMarketFeed() {
        try {
            await this.initProtobuf();
            const wsUrl = await this.getMarketFeedUrl();
            this.upstoxWs = await this.connectWebSocket(io, wsUrl);
            this.isInitialized = true;
            console.log(this.isInitialized)
            console.log("WebSocket connection initialized.");
            return this.upstoxWs;
        } catch (error) {
            console.error("Error initializing WebSocket:", error);
        }
    }
}
































// import { io } from ".";
// import Redis from "ioredis";

// const redisClient = new Redis(
//   "rediss://default:AeQcAAIjcDE0MjMyYTMzNDEwYzc0Y2ZiOWFkMzk1M2JlZTgwM2IwMHAxMA@helpful-polliwog-58396.upstash.io:6379"
// );
// //redisClient2 will connect to default port
// const redisClient2 = new Redis(
//     "redis://127.0.0.1:6379"
// )
// // import { initializeMarketFeed, io } from ".";
// var UpstoxClient = require("upstox-js-sdk");
// const WebSocket = require("ws").WebSocket;
// const protobuf = require("protobufjs");

// const this.access_token="eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiJLTDI3NzAiLCJqdGkiOiI2NzQxODRhN2E2Y2U3MTFjOTNmZTg4MDciLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaWF0IjoxNzMyMzQ3MDQ3LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3MzIzOTkyMDB9.A9UezQZ4IhUmEyB6BoL_21J3zzWFD1-XO8AyCSJldU0";

// let keysData:string[];
//   let protobufRoot:any = null;
//   let defaultClient = UpstoxClient.ApiClient.instance;
//   let apiVersion = "2.0";
//   let OAUTH2 = defaultClient.authentications["OAUTH2"];

// export class SocketStore {
//     private static upstoxWs: any;
//     private static access_token = "YOUR_ACCESS_TOKEN";
//     private static instance: SocketStore;

//     public static getInstance(): SocketStore {
//         if (!SocketStore.instance) {
//             SocketStore.instance = new SocketStore();
//         }
//         return SocketStore.instance;
//     }

//     private constructor() {SocketStore.initializeMarketFeed()}

//     private async getUpstoxWs() {
//         if(!SocketStore.upstoxWs) {
//              this.upstoxWs = await SocketStore.initializeMarketFeed();
//         }
//         return SocketStore.upstoxWs;
//     }


//   public  subscribeTokens = async ( instrumentKeys: string[]) => {
//     const ws = await this.getUpstoxWs();
//     if (!ws || ws.readyState !== WebSocket.OPEN) {
//       console.error("WebSocket is not open. Cannot subscribe to tokens.");
//       return;
//     }
  
//     const subscriptionMessage = {
//       guid: "someguid",
//       method: "sub",
//       data: {
//         mode: "ltpc", // Subscription mode (e.g., LTP, LTPC)
//         instrumentKeys: instrumentKeys,
//       },
//     };
  
//     try {
//       ws.send(Buffer.from(JSON.stringify(subscriptionMessage)));
//       console.log(`Subscribed to tokens: ${instrumentKeys}`);
//     } catch (error) {
//       console.error("Failed to send subscription message:", error);
//     }
//   };


  
  
//   // Function to authorize the market data feed
//   private static getMarketFeedUrl = async () => {
//     // socketAccessToken = await redisClient.get("SOCKET_ACCESS_TOKEN")
//     OAUTH2.accessToken = socketAccessToken;
//     return new Promise((resolve, reject) => {
//       let apiInstance = new UpstoxClient.WebsocketApi(); // Create new Websocket API instance
//       // Call the getMarketDataFeedAuthorize function from the API
//       apiInstance.getMarketDataFeedAuthorize(
//         apiVersion,
//         (error:Error, data:any, response:any) => {
//           if (error) reject(error); // If there's an error, reject the promise
//           else resolve(data.data.authorizedRedirectUri); // Else, resolve the promise with the authorized URL
//         }
//       );
//     });
//   };
  
//   // Function to establish WebSocket connection
//   private static connectWebSocket = async (io:any, wsUrl:any) => {
//     return new Promise((resolve, reject) => {
//       const ws:any = new WebSocket(wsUrl, {
//         headers: {
//           "Api-Version": apiVersion,
//           Authorization: "Bearer " + OAUTH2.accessToken,
//         },
//         followRedirects: true,
//       });
  
//       // WebSocket event handlers
//       ws.on("open", async() => {
//         console.log("connected");
//         resolve(ws); // Resolve the promise once connected
//         const data=await redisClient.get("instrument_keys_2")
//         if(!data) throw new Error('Instrument keys not found');
//         keysData=JSON.parse(data);
//         keysData=[
//             'NSE_INDEX|Nifty Fin Service',
//           ]
//         // console.log(keysData);
//         // Set a timeout to send a subscription message after 1 second
//         setTimeout(() => {
//           const data = {
//             guid: "someguid",
//             method: "sub",
//             data: {
//               mode: "ltpc", //try putting ltpc here
//               instrumentKeys: keysData,
//             },
//           };
//           ws.send(Buffer.from(JSON.stringify(data)));
//         }, 1000);
//       });
  
//       ws.on("close", () => {
//         console.log("disconnected");
//       });
  
//       ws.on("message", (data:any) => {
//         const parsedData = JSON.stringify(this.decodeProfobuf(data)); // Decode the protobuf message on receiving it
//         const parsedObject = JSON.parse(parsedData);
//         console.log(parsedData);
//         redisClient2.publish("market-data", JSON.stringify(parsedObject));
//         io.emit("market-data", parsedObject);
//       });
  
//       ws.on("error", (error:Error) => {
//         console.log("error:", error);
//         reject(error); // Reject the promise on error
//       });
//     });
//   };
  
//   // Function to initialize the protobuf part
//   private static initProtobuf = async () => {
//     protobufRoot = await protobuf.load(__dirname + "/MarketDataFeed.proto");
//     console.log("Protobuf part initialization complete");
//   };
  
//   // Function to decode protobuf message
//   private static decodeProfobuf = (buffer:Buffer) => {
//     if (!protobufRoot) {
//       console.warn("Protobuf part not initialized yet!");
//       return null;
//     }
  
//     const FeedResponse = protobufRoot.lookupType(
//       "com.upstox.marketdatafeeder.rpc.proto.FeedResponse"
//     );
//     return FeedResponse.decode(buffer);
//   };
  
//   // Initialize the protobuf part and establish the WebSocket connection
//   private static initializeMarketFeed = async () => {
  
//     try {
//       await this.initProtobuf(); // Initialize protobuf
//       const wsUrl = await this.getMarketFeedUrl(); // Get the market feed URL
//       const ws= await this.connectWebSocket(io, wsUrl); // Connect to the WebSocket
//       console.log("web socket connected");
//       return ws;
//     // this.upstoxWs=ws
//     } catch (error) {
//       console.error("An error occurred:", error);
//     }
//   }

// }
