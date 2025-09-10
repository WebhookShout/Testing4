const ServiceKey = "44pk-uopl-cVIp-kayv-pQjd-QdG1-Dns1-adO0-russa-1ov3r";

//-- Encode Decode Word Function
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
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


// Hash code encoder function
function encodeHash(text, key = "ILoveRussianGirl") {
  return btoa(
    [...text].map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join("")
  );
}

// Hash code decoder function
function decodeHash(encoded, key = "ILoveRussianGirl") {
  const text = atob(encoded);
  return [...text].map((c, i) => 
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join("");
}


export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.split("/").filter(Boolean);
    const method = request.method;
    const ip = request.headers.get("CF-Connecting-IP") || "Unknown";

    // Create Key (always expires in 24h)
    if (path[0] === "create" && method === "POST") {
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      const key = EncodeText(encodeHash(expiresAt.toString()), ServiceKey);
      
      return new Response(key, {
        headers: { "Content-Type": "text/plain" }
      });
    }

    // Check key
    if (path[0] === "check" && path[1]) {
      const key = path[1];
      
      return new Response(DecodeText(decodeHash(key), ServiceKey), {
        headers: { "Content-Type": "text/plain" }
      });
    }

    return new Response("404: Not found", { status: 404 });
  }
};
