// Importování potřebných modulů
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

// Inicializace Express aplikace a HTTP serveru
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servírování statických souborů z adresáře "public"
app.use(express.static(path.join(__dirname, "public")));

// Proměnné pro správu stavu serveru
let clients = new Map(); // Mapa klientů (clientId => { socket, cursor, color })
let documentState = ""; // Sdílený stav textového dokumentu
let clientCount = 0; // Počet připojených klientů

// Událost při navázání připojení klienta
wss.on("connection", (socket) => {
  const clientId = clientCount++; // Přidělení unikátního ID klientovi
  const clientColor = `hsl(${Math.random() * 360}, 70%, 70%)`; // Generování unikátní barvy

  // Uložení klienta do mapy
  clients.set(clientId, { socket, cursor: { x: 0, y: 0 }, color: clientColor });

  console.log(`Client connected: ${clientId}`); // Logování připojení klienta

  // Oznámení ostatním klientům o připojení nového uživatele
  broadcast({ type: "userConnect", id: clientId, color: clientColor });

  // Odeslání inicializačních dat novému klientovi
  socket.send(
      JSON.stringify({
        type: "init",
        documentState, // Aktuální stav dokumentu
        clients: Array.from(clients.keys()).map((id) => ({
          id,
          color: clients.get(id).color, // Barva ostatních klientů
        })),
      })
  );

  // Obsluha zpráv od klienta
  socket.on("message", (message) => {
    const data = JSON.parse(message); // Parsování příchozí zprávy
    switch (data.type) {
      case "textChange": // Změna textu
        documentState = applyChange(documentState, data.change); // Aktualizace stavu dokumentu
        broadcast({ type: "textUpdate", change: data.change }, clientId); // Odeslání změny ostatním klientům
        break;

      case "cursorMove": // Pohyb kurzoru
        clients.get(clientId).cursor = data.cursor; // Aktualizace pozice kurzoru klienta
        broadcast(
            { type: "cursorUpdate", id: clientId, cursor: data.cursor },
            clientId
        ); // Odeslání nové pozice ostatním
        break;

      case "highlight": // Zvýraznění textu
        broadcast(
            {
              type: "highlight",
              id: clientId,
              range: data.range,
              color: clientColor,
            },
            clientId
        ); // Odeslání informace o zvýraznění ostatním
        break;
    }
  });

  // Událost při odpojení klienta
  socket.on("close", () => {
    clients.delete(clientId); // Odebrání klienta z mapy
    broadcast({ type: "userDisconnect", id: clientId }); // Informování ostatních klientů
  });
});

// Funkce pro odesílání zpráv všem klientům kromě jednoho
const broadcast = (data, exceptId = null) => {
  const payload = JSON.stringify(data); // Serializace dat do JSON
  clients.forEach((client, clientId) => {
    if (clientId !== exceptId) {
      client.socket.send(payload); // Odeslání dat všem klientům kromě vyjmutého
    }
  });
};

// Funkce pro aplikaci změn textu na dokument
const applyChange = (text, change) => {
  // Jednoduché přepsání stavu dokumentu (pro zjednodušení)
  // Tuto logiku lze vylepšit pokročilými algoritmy diff a patch
  return change;
};

// Spuštění serveru na portu 8080
server.listen(8080, () =>
    console.log("Server running on http://localhost:8080")
);
