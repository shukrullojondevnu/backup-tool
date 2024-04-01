import { spawnSync } from "node:child_process";
import path from "node:path";
import fastify from "fastify";
import fs from "node:fs";
import fastifyCors from "@fastify/cors";
import fastifyIO from "fastify-socket.io";
import ss from "socket.io-stream";
import multipart from "@fastify/multipart";

const agents = {};
const server = fastify({
  logger: true,
});
server
  .register(fastifyCors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
  .register(fastifyIO, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  })
  .register(multipart);

server
  .get("/selectFolder", (_req, reply) => {
    const filePath = path.resolve("./openSelectFolderDialog.ps1");
    const folderPath = spawnSync(`${filePath}`, [], {
      shell: "powershell.exe",
    });
    reply.send({
      path: folderPath.output.toString().slice(1, -2),
    });
  })
  .post("/backup", (req, reply) => {
    const { socketId, ...payload } = req.body;
    agents[socketId].emit("createBackup", payload, ({ path, fileName }) => {
      if (!path.err) {
        agents[socketId].emit("sendBackup", { path, fileName }, (res) => {
          reply.send(res);
        });
      }
    });
  });

server.ready().then(() => {
  server.io.on("connection", (socket) => {
    console.log(socket.id);
    ss(socket).on("uploadBackup", (stream, { fileName }) => {
      const backupsPath = path.resolve(`./backups/${fileName}`);
      stream.pipe(fs.createWriteStream(backupsPath));
      stream.on("data", (data) => {
        console.log(data.length);
      });
    });
    agents[`${socket.id}`] = socket;
  });
});

server.listen({ port: 3100 });
