import express from "express";
import { engine } from "express-handlebars";
import { __dirname } from "./utils.js";
import viewsRouter from "./routes/views.router.js";
import productsRouter from "./routes/products.router.js";
import cartsRouter from "./routes/cart.router.js"
import usersRouter from "./routes/users.router.js"
import sessionsRouter from "./routes/session.router.js"
import { productsManager } from "./daos/mongoDB/productManagerDB.js";
import { messagesManager } from "./daos/mongoDB/messageManagerDB.js";
import session from "express-session";
import { Server } from "socket.io";
import "./dao/configDB.js";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import passport from "passport";
import "./passport.js"
import config from "./config.js"

const URI="mongodb+srv://franciscosegu:Riverplate92@cluster0.gjwkb4d.mongodb.net/2daPreEntrega?retryWrites=true&w=majority";
const app = express();

app.use(session({
  store: new MongoStore({
    mongoUrl:URI
  }),
  secret: "secretSession",
  cookie: {maxAge:60000},
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(cookieParser("SecretCookie"))

//passport
app.use(passport.initialize())
app.use(passport.session())

// handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", __dirname + "/views");

app.use("/api/products", productsRouter);
app.use("/", viewsRouter);
app.use("/api/carts", cartsRouter);
app.use("/api/users", usersRouter);
app.use("/api/sessions", sessionsRouter);

const httpServer = app.listen(8080, () => {
  console.log("Escuchando al puerto 8080");
});

const socketServer = new Server(httpServer);
socketServer.on("connection", (socket) => {
  socket.on("newMessage", async(message) => {
    await messagesManager.createOne(message)
    const messages = await messagesManager.findAll()
    socketServer.emit("sendMessage", messages);
  });

  socket.on("showProducts", async() => {
    const products = await productsManager.findAll({limit:10, page:1, sort:{}, query:{} })
    socketServer.emit("sendProducts", products);
  });
});