function hexToBytes(hex = "") {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Memasang EME ClearKey pada elemen <video> jika kid & key tersedia.
 * Aman dipanggil sebelum memutar URL; tidak melempar error jika stream sudah terbuka.
 */
export async function attachClearKeyIfNeeded(videoElement, kidHex, keyHex) {
  if (!videoElement || !kidHex || !keyHex) return false;
  if (!navigator.requestMediaKeySystemAccess) return false;

  try {
    const config = [
      {
        initDataTypes: ["cenc", "keyids", "webm"],
        videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' }]
      }
    ];

    const keySystemAccess = await navigator.requestMediaKeySystemAccess(
      "org.w3.clearkey",
      config
    );
    const mediaKeys = await keySystemAccess.createMediaKeys();
    await videoElement.setMediaKeys(mediaKeys);

    const kidB64 = bytesToBase64Url(hexToBytes(kidHex));
    const keyB64 = bytesToBase64Url(hexToBytes(keyHex));

    videoElement.addEventListener(
      "encrypted",
      async (event) => {
        try {
          const session = mediaKeys.createSession();
          const jwkSet = {
            keys: [
              {
                kty: "oct",
                alg: "A128KW",
                kid: kidB64,
                k: keyB64,
                ext: true
              }
            ],
            type: "temporary"
          };

          session.addEventListener("message", async (msgEvent) => {
            const encoder = new TextEncoder();
            await session.update(encoder.encode(JSON.stringify(jwkSet)));
          });

          if (event.initDataType && event.initData) {
            await session.generateRequest(event.initDataType, event.initData);
          }
        } catch (err) {
          console.warn("ClearKey session warning:", err);
        }
      },
      { once: true }
    );

    return true;
  } catch {
    return false;
  }
}

/**
 * Dekripsi sisi klien berbasis WebCrypto AES-CTR untuk payload terenkripsi penuh.
 */
export async function decryptAesCtrPayload(encryptedBuffer, keyHex, counterHex = "00000000000000000000000000000000") {
  const keyBytes = hexToBytes(keyHex);
  const counterBytes = hexToBytes(counterHex.padEnd(32, "0").slice(0, 32));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CTR" },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-CTR",
      counter: counterBytes,
      length: 128
    },
    cryptoKey,
    encryptedBuffer
  );

  return new Blob([decrypted], { type: "video/mp4" });
}
