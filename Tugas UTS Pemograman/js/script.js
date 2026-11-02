const $ = (id) => document.getElementById(id);
const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");
const page = document.body.dataset.page;
const ambil = (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
const simpan = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const penggunaAll = () => dataPengguna.concat(ambil("penggunaBaru", []));
const bukaModal = (id) => $(id).classList.add("buka");
const tutupModal = () => document.querySelectorAll(".modal").forEach((m) => m.classList.remove("buka"));

// Guard login, logout, dan tombol tutup modal
if (page !== "login" && !sessionStorage.getItem("user")) location.href = "index.html";
if ($("btnLogout")) $("btnLogout").onclick = () => { sessionStorage.clear(); location.href = "index.html"; };
document.querySelectorAll("[data-tutup]").forEach((b) => (b.onclick = tutupModal));
document.addEventListener("keydown", (e) => e.key === "Escape" && tutupModal());

/* ---------- LOGIN ---------- */
if (page === "login") {
  $("formLogin").onsubmit = (e) => {
    e.preventDefault();
    const email = $("email").value.trim(), pass = $("password").value;
    $("errEmail").textContent = email ? "" : "Email wajib diisi.";
    $("errPass").textContent = pass ? "" : "Password wajib diisi.";
    if (!email || !pass) return;
    const u = penggunaAll().find((x) => x.email === email && x.password === pass);
    if (!u) return alert("Email/password yang anda masukkan salah");
    sessionStorage.setItem("user", JSON.stringify(u));
    location.href = "dashboard.html";
  };
  $("btnLupa").onclick = () => bukaModal("modalLupa");
  $("btnDaftar").onclick = () => bukaModal("modalDaftar");
  $("kirimLupa").onclick = () => {
    const em = $("emailLupa").value.trim();
    if (!penggunaAll().some((x) => x.email === em)) { $("errLupa").textContent = "Email tidak terdaftar."; return; }
    tutupModal(); alert("Link reset password dikirim ke " + em);
  };
  $("simpanDaftar").onclick = () => {
    const nama = $("namaDaftar").value.trim(), email = $("emailDaftar").value.trim(), password = $("passDaftar").value;
    let msg = "";
    if (!nama || !/^\S+@\S+\.\S+$/.test(email)) msg = "Isi nama dan email yang valid.";
    else if (password.length < 6) msg = "Password minimal 6 karakter.";
    else if (penggunaAll().some((x) => x.email === email)) msg = "Email sudah terdaftar.";
    $("errDaftar").textContent = msg;
    if (msg) return;
    const baru = ambil("penggunaBaru", []); baru.push({ nama, email, password }); simpan("penggunaBaru", baru);
    tutupModal(); alert("Pendaftaran berhasil, silakan login.");
  };
}

/* ---------- DASHBOARD ---------- */
if (page === "dashboard") {
  const jam = new Date().getHours();
  const sapa = jam < 11 ? "Selamat pagi" : jam < 15 ? "Selamat siang" : jam < 19 ? "Selamat sore" : "Selamat malam";
  $("greeting").textContent = `${sapa}, ${JSON.parse(sessionStorage.getItem("user")).nama}!`;
  $("jam").textContent = new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" });
}

/* ---------- STOK ---------- */
const katalog = () => dataKatalogBuku.concat(ambil("bukuBaru", []));
if (page === "stok") {
  const buatBaris = (b) => {
    const tr = document.createElement("tr");
    [b.kode, b.judul, b.kategori, rupiah(b.harga), b.stok > 0 ? b.stok : "Habis"].forEach((v, i) => {
      const td = document.createElement("td"); td.textContent = v;
      if (i === 4 && b.stok === 0) td.className = "habis";
      tr.appendChild(td);
    });
    return tr;
  };
  const render = (q = "") => {
    $("tbStok").innerHTML = "";
    katalog().filter((b) => b.judul.toLowerCase().includes(q.toLowerCase())).forEach((b) => $("tbStok").appendChild(buatBaris(b)));
  };
  render();
  $("cari").oninput = (e) => render(e.target.value);
  $("formStok").onsubmit = (e) => {
    e.preventDefault();
    const b = { kode: $("sKode").value.trim(), judul: $("sJudul").value.trim(), kategori: $("sKat").value.trim(), harga: +$("sHarga").value, stok: +$("sStok").value };
    let msg = "";
    if (!b.kode || !b.judul || !b.kategori) msg = "Kode, judul, dan kategori wajib diisi.";
    else if (!(b.harga > 0) || $("sStok").value === "" || b.stok < 0) msg = "Harga harus > 0 dan stok tidak boleh kosong/negatif.";
    else if (katalog().some((x) => x.kode === b.kode)) msg = "Kode buku sudah ada.";
    $("errStok").textContent = msg;
    if (msg) return;
    const baru = ambil("bukuBaru", []); baru.push(b); simpan("bukuBaru", baru);
    $("tbStok").appendChild(buatBaris(b)); e.target.reset();
  };
}

/* ---------- CHECKOUT ---------- */
if (page === "checkout") {
  let cart = [];
  katalog().filter((b) => b.stok > 0).forEach((b) => {
    const o = document.createElement("option"); o.value = b.kode; o.textContent = `${b.judul} (${rupiah(b.harga)})`; $("pilihBuku").appendChild(o);
  });
  const renderCart = () => {
    $("tbCart").innerHTML = "";
    cart.forEach((it, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td></td><td>${rupiah(it.harga)}</td><td><input type="number" min="1" max="${it.maks}" value="${it.qty}" style="width:70px" aria-label="Jumlah"></td><td>${rupiah(it.harga * it.qty)}</td><td><button class="bahaya" type="button">Hapus</button></td>`;
      tr.firstChild.textContent = it.judul;
      tr.querySelector("input").onchange = (e) => { it.qty = Math.min(Math.max(1, +e.target.value || 1), it.maks); renderCart(); };
      tr.querySelector("button").onclick = () => { cart.splice(i, 1); renderCart(); };
      $("tbCart").appendChild(tr);
    });
    $("total").textContent = rupiah(cart.reduce((s, x) => s + x.harga * x.qty, 0));
  };
  $("tambahItem").onclick = () => {
    const b = katalog().find((x) => x.kode === $("pilihBuku").value), qty = +$("jmlBuku").value;
    if (!b || !(qty >= 1)) return alert("Pilih buku dan isi jumlah minimal 1.");
    const ada = cart.find((x) => x.kode === b.kode);
    if ((ada ? ada.qty : 0) + qty > b.stok) return alert(`Stok ${b.judul} hanya ${b.stok}.`);
    ada ? (ada.qty += qty) : cart.push({ kode: b.kode, judul: b.judul, harga: b.harga, qty, maks: b.stok });
    renderCart();
  };
  const renderRiwayat = () => {
    $("tbRiwayat").innerHTML = "";
    const data = ambil("pesananBaru", []);
    data.forEach((p) => {
      const tr = document.createElement("tr");
      [p.no, p.nama, p.tanggal, rupiah(p.total)].forEach((v) => { const td = document.createElement("td"); td.textContent = v; tr.appendChild(td); });
      $("tbRiwayat").appendChild(tr);
    });
    if (!data.length) $("tbRiwayat").innerHTML = '<tr><td colspan="4">Belum ada transaksi.</td></tr>';
  };
  renderRiwayat();
  $("formCheckout").onsubmit = (e) => {
    e.preventDefault();
    const nama = $("cNama").value.trim(), hp = $("cHp").value.trim(), alamat = $("cAlamat").value.trim();
    $("eNama").textContent = nama ? "" : "Nama wajib diisi.";
    $("eHp").textContent = /^08\d{8,11}$/.test(hp) ? "" : "No. HP harus diawali 08 (10-13 digit).";
    $("eAlamat").textContent = alamat.length >= 10 ? "" : "Alamat minimal 10 karakter.";
    if (!cart.length) return alert("Keranjang masih kosong.");
    if (document.querySelector("#formCheckout .err:not(:empty)")) return;
    const total = cart.reduce((s, x) => s + x.harga * x.qty, 0);
    const no = "DO" + Date.now().toString().slice(-7);
    const data = ambil("pesananBaru", []);
    data.push({ no, nama, tanggal: new Date().toISOString().slice(0, 10), total, ekspedisi: $("cEks").value, jenis: "Reguler", status: 0 });
    simpan("pesananBaru", data);
    $("noDO").textContent = no; bukaModal("modalOk");
    cart = []; renderCart(); renderRiwayat(); e.target.reset();
  };
}

/* ---------- TRACKING ---------- */
if (page === "tracking") {
  $("formTrack").onsubmit = (e) => {
    e.preventDefault();
    const no = $("nomorDO").value.trim().toUpperCase();
    $("hasil").classList.add("hide");
    if (!no) { $("errDO").textContent = "Nomor DO wajib diisi."; return; }
    $("errDO").textContent = "";
    const d = dataTracking[no] || ambil("pesananBaru", []).find((p) => p.no === no);
    if (!d) return alert("Nomor Delivery Order tidak ditemukan.");
    $("progress").innerHTML = "";
    tahapPengiriman.forEach((t, i) => {
      const s = document.createElement("div"); s.textContent = t;
      s.className = i < d.status ? "selesai" : i === d.status ? "sekarang" : "";
      $("progress").appendChild(s);
    });
    const baris = [["Nama pemesan", d.nama], ["Status", tahapPengiriman[d.status]], ["Ekspedisi", d.ekspedisi], ["Tanggal kirim", d.tanggal], ["Jenis paket", d.jenis], ["Total pembayaran", rupiah(d.total)]];
    $("detail").innerHTML = "";
    baris.forEach(([k, v]) => { const tr = document.createElement("tr"); tr.innerHTML = "<th scope='row'></th><td></td>"; tr.firstChild.textContent = k; tr.lastChild.textContent = v; $("detail").appendChild(tr); });
    $("hasil").classList.remove("hide");
  };
}
