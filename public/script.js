// Vytvoření WebSocket připojení
const ws = new WebSocket("ws://localhost:8080");

// Odkaz na textový editor a stav připojení
const editor = document.getElementById("editor");
const status = document.getElementById("status");

// Dynamicky vytvořený seznam uživatelů
const userList = document.createElement("div");
userList.id = "user-list"; // Nastavení ID seznamu uživatelů
document
    .getElementById("container-in-editor-container-under-editor") // Najde kontejner v HTML
    .appendChild(userList); // Přidá seznam uživatelů do dokumentu

// Objekt pro správu kurzorů
const cursors = {};
let clientId; // Identifikátor aktuálního uživatele

// Událost při navázání připojení k serveru
ws.onopen = () => {
  status.innerText = "Connected to server"; // Aktualizace stavu
  status.style.color = "#35f067"; // Nastavení zelené barvy pro "připojeno"
  status.style.setProperty("--color", "#35f067");
  editor.contentEditable = "true"; // Povolení úprav v editoru
};

// Událost při uzavření připojení k serveru
ws.onclose = () => {
  status.innerText = "Disconnected from server"; // Aktualizace stavu
  status.style.color = "red"; // Nastavení červené barvy pro "odpojeno"
  status.style.setProperty("--color", "red");
  editor.contentEditable = "false"; // Zakázání úprav v editoru
};

// Obsluha příchozích zpráv ze serveru
ws.onmessage = (event) => {
  const data = JSON.parse(event.data); // Parsování JSON zprávy
  switch (data.type) { // Rozdělení podle typu zprávy
    case "init": // Inicializace editoru
      clientId = data.id; // Nastavení ID klienta
      editor.innerHTML = data.documentState; // Načtení stavu dokumentu

      // Přidání kurzorů a uživatelů
      data.clients.forEach((client) => {
        createCursor(client.id, client.color); // Vytvoření kurzoru
        addUserToList(client.id, client.color); // Přidání do seznamu uživatelů
      });
      break;

    case "textUpdate": // Aktualizace textu
      applyChange(data.change); // Změna obsahu editoru
      break;

    case "highlight": // Zvýraznění textu
      applyHighlight(data.range, data.color); // Zvýraznění rozsahu
      break;

    case "cursorUpdate": // Aktualizace pozice kurzoru
      updateCursor(data.id, data.cursor); // Pohyb kurzoru
      break;

    case "userConnect": // Připojení nového uživatele
      createCursor(data.id, data.color); // Vytvoření kurzoru
      addUserToList(data.id, data.color); // Přidání do seznamu uživatelů
      break;

    case "userDisconnect": // Odpojení uživatele
      removeCursor(data.id); // Odebrání kurzoru
      removeUserFromList(data.id); // Odebrání ze seznamu uživatelů
      break;
  }
};

// Událost při změně obsahu editoru
editor.addEventListener("input", () => {
  const text = editor.innerText; // Získání aktuálního textu
  ws.send(JSON.stringify({ type: "textChange", change: text })); // Odeslání změny na server
});

// Událost při pohybu myši
document.addEventListener("mousemove", (event) => {
  const cursor = { x: event.clientX, y: event.clientY }; // Souřadnice kurzoru
  ws.send(JSON.stringify({ type: "cursorMove", cursor })); // Odeslání pozice na server
});

// Událost při puštění myši (pro zvýraznění textu)
editor.addEventListener("mouseup", () => {
  const selection = window.getSelection(); // Získání výběru
  if (!selection.rangeCount) return; // Pokud není výběr, nic se neděje

  const range = selection.getRangeAt(0); // Získání rozsahu výběru
  const start = range.startOffset; // Začátek výběru
  const end = range.endOffset; // Konec výběru

  ws.send(JSON.stringify({ type: "highlight", range: { start, end } })); // Odeslání rozsahu na server
});

// Funkce pro aplikaci změny textu
function applyChange(change) {
  editor.innerText = change; // Aktualizace obsahu editoru
}

// Funkce pro zvýraznění textu
function applyHighlight(range, color) {
  const text = editor.innerText; // Získání textu editoru
  const { start, end } = range; // Rozsah zvýraznění

  const before = text.slice(0, start); // Text před zvýrazněním
  const highlighted = `<span class="highlight" style="background-color: ${color};">${text.slice(
      start,
      end
  )}</span>`; // Zvýrazněný text
  const after = text.slice(end); // Text za zvýrazněním

  editor.innerHTML = before + highlighted + after; // Aktualizace obsahu s HTML
}

// Funkce pro vytvoření kurzoru uživatele
function createCursor(id, color) {
  if (id === clientId || cursors[id]) return; // Pokud je kurzor již vytvořen, nic se neděje
  const cursorElement = document.createElement("div"); // Vytvoření kurzoru
  cursorElement.className = "cursor"; // Nastavení třídy
  cursorElement.style.backgroundColor = color; // Barva kurzoru
  cursorElement.style.setProperty("--color", color);
  document.body.appendChild(cursorElement); // Přidání kurzoru do dokumentu
  cursors[id] = cursorElement; // Uložení kurzoru do objektu
}

// Funkce pro aktualizaci pozice kurzoru
function updateCursor(id, cursor) {
  if (id === clientId) return; // Aktuální uživatel neaktualizuje svůj kurzor
  const cursorElement = cursors[id]; // Najde odpovídající kurzor
  if (!cursorElement) return; // Pokud neexistuje, nic se neděje
  cursorElement.style.left = `${cursor.x}px`; // Nastavení vodorovné pozice
  cursorElement.style.top = `${cursor.y}px`; // Nastavení svislé pozice
}

// Funkce pro odebrání kurzoru uživatele
function removeCursor(id) {
  const cursorElement = cursors[id]; // Najde odpovídající kurzor
  if (cursorElement) {
    cursorElement.remove(); // Odebrání z dokumentu
    delete cursors[id]; // Odstranění z objektu
  }
}

// Funkce pro přidání uživatele do seznamu
function addUserToList(id, color) {
  const existingUser = document.getElementById(`user-${id}`); // Kontrola, zda již existuje
  if (existingUser) return;

  const userElement = document.createElement("div"); // Vytvoření divu pro uživatele
  userElement.className = "user"; // Nastavení třídy
  userElement.id = `user-${id}`; // Nastavení ID
  userElement.style.color = color; // Barva uživatele
  userElement.innerText = `User ${id}`; // Zobrazení uživatele
  userElement.style.setProperty("--color", color);
  userList.appendChild(userElement); // Přidání do seznamu
}

// Funkce pro odebrání uživatele ze seznamu
function removeUserFromList(id) {
  const userElement = document.getElementById(`user-${id}`); // Najde uživatele podle ID
  if (userElement) userElement.remove(); // Odebrání ze seznamu
}
