const ServiceKey = "44pk-uopl-cVIp-kayv-pQjd-QdG1-Dns1-adO0-russa-1ov3r";
const HashCode_Database = "https://hash-code-20ecd-default-rtdb.firebaseio.com/";
const HashCode_SavedData = "https://raw.githubusercontent.com/MainScripts352/Database/refs/heads/main/Hash%20Code%20Database";
  
//-- Encode Decode Word Function
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
function toBase32(bytes) {
  let bits = 0, value = 0, output = '';
  for (let byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

function fromBase32(str) {
  let bits = 0, value = 0, output = [];
  for (let c of str.toUpperCase()) {
    const index = base32Alphabet.indexOf(c);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

function EncodeText(text, key) {
  const data = new TextEncoder().encode(text);
  const keyData = new TextEncoder().encode(key);
  const encrypted = data.map((b, i) => b ^ keyData[i % keyData.length]);
  return toBase32(encrypted);
}

function DecodeText(encoded, key) {
  const data = fromBase32(encoded);
  const keyData = new TextEncoder().encode(key);
  const decrypted = data.map((b, i) => b ^ keyData[i % keyData.length]);
  return new TextDecoder().decode(new Uint8Array(decrypted));
}
//--


// Get Date Timestamp function with 24 hours
function getTimestamp() {
  return Date.now() + (24 * 60 * 60 * 1000);
}

// Get Current Date Timestamp function
function getcurrentTimestamp() {
  return Date.now();
}


export default {
  async fetch(request) {
    const url = new URL(request.url);
    const domain = url.origin; // get service full link
    const path = url.pathname.split("/").filter(Boolean);
    const method = request.method;
    const ip = request.headers.get("CF-Connecting-IP") || "Unknown";

    // Create Key (always expires in 24h)
    if (path[0] === "create" && path[1] && method === "GET") {
      const encodedkey = EncodeText(getTimestamp().toString(), ServiceKey);
      const hashencoded = await fetch(`https://api.hashify.net/hash/md5/hex?value=${encodedkey}`);
      const hash_data = await hashencoded.json();
      const key = hash_data.Digest;
      
      // Detect if link is expired
      if (getcurrentTimestamp() >= Number(atob(decodeURIComponent(path[1])))) {
        return new Response("403: Invalid Link or Expired!", { status: 403 });
      }
        
      // Put Hash Data in Hash code Database
      const response = await fetch(`${HashCode_Database}${key}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: encodedkey, type: "MD5" })
      });
      //

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

    // Check key
    if (path[0] === "check" && path[1] && method === "GET") {
      let key = path[1];
      key = key.replace("KEY_", "");
      
      const githubRes = await fetch(HashCode_SavedData);
      const githubData = await githubRes.json();
  
      const firebaseRes = await fetch(`${HashCode_Database}${key}.json`);
      const firebaseData = await firebaseRes.json();

      let valid = false
      if (key in githubData) {
        if (Number(DecodeText(githubData[key].message, ServiceKey)) >= getcurrentTimestamp()) {
          valid = true
        }
      } else if (firebaseData !== null) {
        if (Number(DecodeText(firebaseData.message, ServiceKey)) >= getcurrentTimestamp()) {
          valid = true
        }
      }
      return new Response(valid, {
        headers: { "Content-Type": "text/plain" }
      });
    }

    // Check Service Status
    if (path[0] === "status" && method === "GET") {
      return new Response(true, {
        headers: { "Content-Type": "text/plain" }
      });
    }
    
    return new Response("404: Not found", { status: 404 });
  }
};
