import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyIO from "fastify-socket.io";
import ss from "socket.io-stream";
import { io } from "socket.io-client";

const DBMS = {
  postgres: {
    dumpTool: "pg_dump",
    restoreTool: "pg_restore.exe",
  },
  mysql: {
    dumpTool: "mysqldump",
    restoreTool: "mysql.exe",
  },
  msql: {
    dumpTool: "Backup-SqlDatabase",
    restoreTool: "mysql.exe",
  },
};

const data = [
  {
    name: "Mysql",
    dbms: "mysql",
    host: "localhost",
    port: "3306",
    path: "D:\\Backups\\mysql\\",
  },
  {
    name: "Postgresql",
    dnms: "postgres",
    host: "localhost",
    port: "5432",
    path: "D:\\Backups\\potgresql\\",
  },
  {
    name: "Msql",
    dbms: "msql",
    host: "localhost",
    port: "3306",
    path: "D:\\Backups\\msql\\",
  },
];

const server = fastify({ logger: true });
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
  });

server.get("/selectFolder", (_req, reply) => {
  const filePath = path.resolve("./openSelectFolderDialog.ps1");
  const folderPath = spawnSync(`${filePath}`, [], { shell: "powershell.exe" });
  reply.send({
    path: folderPath.output.toString().slice(1, -2),
  });
});

server.ready().then(() => {
  server.io.on("connection", (socket) => {
    console.log(socket.id);
    // ...
  });
});

server.listen({ port: 3000 }).then(() => {
  const wsClient = io("http://localhost:3100");
  wsClient
    .on("createBackup", (args, callback) => {
      const { dbms, db, path } = args;
      const date = new Date();
      switch (dbms) {
        case "postgres": {
          const fileName =
            dbms +
            "_" +
            date.toISOString().slice(0, 9) +
            "_" +
            date.getHours() +
            "-" +
            date.getMinutes() +
            ".sql";
          const backup = spawnSync(
            `${DBMS[`${dbms}`]["dumpTool"]}`,
            [`-U postgres -w -f ${path + fileName} ${db}`],
            { shell: "powershell.exe" },
          );
          if (backup.status === 1) {
            fs.rmSync(path + fileName);
            callback({ err: 1, message: "Dump file does not created" });
          }
          callback({ path: path + fileName, fileName });
          break;
        }
        case "mysql": {
          const fileName =
            dbms +
            "_" +
            date.toISOString().slice(0, 9) +
            "_" +
            date.getHours() +
            "-" +
            date.getMinutes() +
            ".sql";
          const backup = spawnSync(
            `${DBMS[`${dbms}`]["dumpTool"]}`,
            [`-u root -p2425 ${db} -r ${path + fileName}`],
            { shell: "powershell.exe" },
          );
          if (backup.status === 1) {
            fs.rmSync(path + fileName);
            callback({ err: 1, message: "Dump file does not created" });
          }
          callback({ path: path + fileName, fileName });
          break;
        }
        case "msql": {
          const fileName =
            dbms +
            "_" +
            date.toISOString().slice(0, 9) +
            "_" +
            date.getHours() +
            "-" +
            date.getMinutes() +
            ".bak";
          const backup = spawnSync(
            `${DBMS[`${dbms}`]["dumpTool"]}`,
            [
              `-ServerInstance "SHUKRULLOJON\\SQLEXPRESS" -Database "${db}" -BackupFile "${
                path + fileName
              }"`,
            ],
            { shell: "powershell.exe" },
          );
          if (backup.status === 1) {
            fs.rmSync(path + fileName);
            callback({ err: 1, message: "Dump file does not created" });
          }
          callback({ path: path + fileName, fileName });
          break;
        }
        default: {
          callback({ err: 1, message: "Dump file does not created" });
        }
      }
    })
    .on("sendBackup", ({ path, fileName }, callback) => {
      callback("sending started");
      const stream = ss.createStream();
      const stats = fs.statSync(path);
      console.log(stats);
      ss(wsClient).emit("uploadBackup", stream, { fileName });
      fs.createReadStream(path).pipe(stream);
    });
});
