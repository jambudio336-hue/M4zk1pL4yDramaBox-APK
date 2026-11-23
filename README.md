# 🎬 M4zk1pL4yDramaBox

**M4zk1pL4yDramaBox** adalah aplikasi streaming sinematik pendek & drama vertikal fullstack dengan antarmuka mewah, responsif di semua ukuran layar, dan terintegrasi langsung ke **Melolo API** serta multi-provider **DramaBuzz API**.

## ✨ Fitur Utama
- **Animasi Masuk Sinematik:** Transisi *cyber-cinema* dengan sapaan *"Selamat datang di apk M4zk1pL4yDramaBox selamat menonton"*.
- **Multi-Provider & Genre:** Dukungan katalog *Melolo*, *DramaBox*, *StarShort*, *ShortMax*, *FlickReels*, serta filter genre lengkap.
- **Pemutar Video Vertikal Aktif:** Mendukung aliran `MP4` dan `HLS (.m3u8)`, pemilih kualitas (`720p`, `540p`, `480p`, `360p`, `240p`), kecepatan putar (`1x`, `1.25x`, `1.5x`, `2x`), *auto-next episode*, dan unduh episode.
- **Dekripsi Sisi Klien (`key` & `kid`):** Modul terintegrasi untuk menangani *EME ClearKey* dan *WebCrypto AES-CTR* pada aliran media yang memerlukan kunci dekripsi.
- **Riwayat Tontonan Otomatis:** Menyimpan progres episode terakhir secara lokal agar bisa langsung dilanjutkan.
- **Auto-Build APK via GitHub Actions:** Setiap *push* ke `main` atau *trigger* manual akan mengompilasi APK yang menggunakan `icon.png` dari *root* direktori dan memublikasikannya ke **Releases**.
