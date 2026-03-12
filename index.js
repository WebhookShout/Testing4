const ServiceKey = '30c3f0300fb195503b7e982b3e0b554a';

// Encode Function
function encode(text, key) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    let c = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(c);
  }
  let b64 = btoa(result).replace(/=/g, "");
  return (b64 + "00000000000000000000000000").slice(0, 26);
}

// Decode Function
function decode(code, key) {
  let raw = atob(code.replace(/0+$/, ""));
  let result = "";
  for (let i = 0; i < raw.length; i++) {
    let c = raw.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(c);
  }
  return result;
}

function _getKeyBytes(key) {
  return new TextEncoder().encode(key);
}

function _bytesToString(bytes) {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(bytes).toString("utf-8");
}

function encodeWithSystemKey(message) {
  if (typeof message !== "string") throw new TypeError("message must be a string");
  const keyBytes = _getKeyBytes(ServiceKey);
  const msgBytes = new TextEncoder().encode(message);
  const keyLen = keyBytes.length;
  let hex = "";
  for (let i = 0; i < msgBytes.length; i++) {
    const xored = msgBytes[i] ^ keyBytes[i % keyLen];
    hex += xored.toString(16).padStart(2, "0");
  }
  return hex;
}

function decodeWithSystemKey(hexstr) {
  if (typeof hexstr !== "string") throw new TypeError("hexstr must be a string");
  if (hexstr.length % 2 !== 0) throw new Error("Invalid hex string length");
  const keyBytes = _getKeyBytes(ServiceKey);
  const keyLen = keyBytes.length;
  const byteLen = hexstr.length / 2;
  let outBytes = new Uint8Array(byteLen);
  for (let i = 0; i < byteLen; i++) {
    const pair = hexstr.substr(i * 2, 2);
    const num = parseInt(pair, 16);
    if (Number.isNaN(num)) throw new Error("Invalid hex characters in input");
    const k = keyBytes[i % keyLen];
    outBytes[i] = num ^ k;
  }
  return _bytesToString(outBytes);
}


// Get timestamp with days expiration
function getTimestamp(days = 0) {
  const now = Date.now();
  const add = days * 24 * 60 * 60 * 1000;
  return now + add;
}

// Remove Data from Database function
async function RemoveData(key) {
  const res = await fetch(`${Database_Link}/Keys/${key}.json?auth=${Database_Key}`, {
    method: 'DELETE',
    headers: {"Content-Type": "application/json"},
    body: null
  })
}

// Add Data to Database function
async function AddData(key, time) {
  const res = await fetch(`${Database_Link}/Keys/${key}.json?auth=${Database_Key}`, {
    method: 'PUT',
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      expiration: time 
    })
  })
}


export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const domain = url.origin; // get service full link
    const path = url.pathname.split("/").filter(Boolean);
    const method = request.method;
    const ip = request.headers.get("CF-Connecting-IP") || "Unknown";

    // Make Key Starter
    if (path[0] === "make" && method === "GET") {
      const timestamp = await getTimestamp(1);
      const key = crypto.randomUUID().replace(/-/g, "").slice(0, 26);
      ctx.waitUntil(AddData(key, timestamp)); // code below it will run imidietly without waiting it finished
      return Response.redirect(`${domain}/create/${key}`, 302);
    }
    
    // Create Key (always expires in 24h)
    if (path[0] === "create" && path[1] && method === "GET") {
      const key = path[1];
      const html = `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Show Key</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 5;
      background: #000;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #fff;
    }

    .container {
      text-align: center;
      padding: 40px 60px;
      border: 1px solid #fff;
      border-radius: 10px;
      background: #111;
      max-width: 500px;
      width: 90%;
    }

    .title {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 15px;
      letter-spacing: 1px;
      color: #aaa;
    }

    .divider {
      width: 60px;
      height: 2px;
      background: #fff;
      margin: 15px auto 25px;
    }

    .key-text {
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 25px;
      word-break: break-all;
    }

    button {
      padding: 12px 30px;
      font-size: 16px;
      font-weight: 600;
      background: #fff;
      color: #000;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    button:hover {
      background: #ddd;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">Your Access Key</div>
    <div class="divider"></div>
    <div class="key-text" id="keyText">KEY_${key}</div>
    <button id="copyBtn" onclick="copyKey()">Copy Key</button>
  </div>

  <script>
    function copyKey() {
      const keyText = document.getElementById("keyText").innerText;
      const copyBtn = document.getElementById("copyBtn");

      // Try modern clipboard API
      navigator.clipboard.writeText(keyText).then(() => {
        copyBtn.innerText = "Copied!";
        setTimeout(() => copyBtn.innerText = "Copy Key", 2000);
      }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = keyText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);

        copyBtn.innerText = "Copied!";
        setTimeout(() => copyBtn.innerText = "Copy Key", 2000);
      });
    }
  </script>
</body>
</html>`;
      
      return new Response(html, {
        headers: { "Content-Type": "text/html" }
      });
    }

    // Check Key
    if (path[0] === "check" && path[1] && method === "GET") {
      let key = path[1];
      key = key.replace("KEY_", "");
      const res = await fetch(`${Database_Link}/Keys/${key}.json`);
      const result = await res.json();
      if (result === null) {
        return new Response("403: Invalid Key", { status: 403 });
      }
      const expiration = result.expiration;
      const time = getTimestamp();
      if (Number(expiration) < time) {
        ctx.waitUntil(RemoveData(key)); // code below it will run imidietly without waiting it finished
        return new Response("403: Key Expired", { status: 403 });
      }
      return new Response('200: Success', {
        headers: { "Content-Type": "text/plain" }
      });
    }
    
    // Check Service Status
    if (path[0] === "status" && method === "GET") {
      return new Response(true, {
        headers: { "Content-Type": "text/plain" }
      });
    }

    if (path[0] === "testing") {
      const timestamp = await getTimestamp(1); 
      const a = encodeWithSystemKey(`${timestamp}`);
      const b = decodeWithSystemKey(a);
      return new Response(`${a}\n${b}`, { status: 200 });
    }
    
    return new Response("404: Not found", { status: 404 });
  }
};
