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


// Encode string → base62 short code function
function encodeString(str) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    num = num * 256 + str.charCodeAt(i); // pack chars into number
  }
  let encoded = "";
  const base = alphabet.length;
  while (num > 0) {
    encoded = alphabet[num % base] + encoded;
    num = Math.floor(num / base);
  }
  return encoded.padStart(5, "A").slice(0, 8); // force 5–8 chars
}

// Decode short code → original string function
function decodeString(code) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const base = alphabet.length;
  let num = 0;
  for (let i = 0; i < code.length; i++) {
    num = num * base + alphabet.indexOf(code[i]);
  }
  let chars = [];
  while (num > 0) {
    chars.unshift(String.fromCharCode(num % 256));
    num = Math.floor(num / 256);
  }
  return chars.join("");
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
      const key = EncodeText(encodeString(expiresAt), ServiceKey);
      
      return new Response(key, {
        headers: { "Content-Type": "text/plain" }
      });
    }

    // Check key
    if (path[0] === "check" && path[1]) {
      const key = path[1];
      
      return new Response(key, {
        headers: { "Content-Type": "text/plain" }
      });
    }

    return new Response("404: Not found", { status: 404 });
  }
};
