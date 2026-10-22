import { httpServerHandler } from "cloudflare:node";
import "./index.js";

export default httpServerHandler({ port: 3000 });