"use strict";

// LOGIN
const USERNAME = "syntaxsquad";
const PASSWORD = "syntax123";

let products = JSON.parse(localStorage.getItem("products") || "[]");
let sales = JSON.parse(localStorage.getItem("sales") || "[]");

const $ = id => document.getElementById(id);

function saveData() {
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("sales", JSON.stringify(sales));
}

function rupiah(value) {
    return "Rp " + Number(value).toLocaleString("id-ID");
}

// NAVIGASI HALAMAN
function showPage(name) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
        page.style.display = "none";
    });

    document.querySelectorAll(".menu[data-page]").forEach(menu => {
        menu.classList.remove("active");
    });

    const page = $(name);
    const menu = document.querySelector(
        `.menu[data-page="${name}"]`
    );

    if (!page) return;

    page.classList.add("active");
    page.style.display = "block";

    if (menu) menu.classList.add("active");

    $("pageTitle").textContent = menu
        ? menu.textContent.trim()
        : name;

    renderAll();
}

// LOGIN
$("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const username = $("username").value.trim();
    const password = $("password").value;

    if (username !== USERNAME || password !== PASSWORD) {
        $("loginError").textContent = "Username atau password salah!";
        return;
    }

    sessionStorage.setItem("isLogin", "true");

    $("loginPage").hidden = true;
    $("appPage").hidden = false;

    showPage("dashboard");
});

// LOGOUT
$("logoutButton").addEventListener("click", function(e) {
    e.preventDefault();

    if (!confirm("Yakin ingin logout?")) return;

    sessionStorage.removeItem("isLogin");

    $("appPage").hidden = true;
    $("loginPage").hidden = false;
    $("loginForm").reset();
});

// KLIK MENU
document.querySelectorAll(".menu[data-page]").forEach(menu => {
    menu.addEventListener("click", function(e) {
        e.preventDefault();
        showPage(this.dataset.page);
    });
});

// TAMBAH PRODUK
$("productForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const product = {
        id: Date.now(),
        nama: $("namaProduk").value.trim(),
        kategori: $("kategoriProduk").value,
        ukuran: $("ukuranProduk").value,
        stok: Number($("stokProduk").value),
        harga: Number($("hargaProduk").value)
    };

    if (!product.nama || !product.kategori || !product.ukuran ||
        product.stok < 0 || product.harga <= 0) {
        alert("Periksa kembali data produk!");
        return;
    }

    products.push(product);
    saveData();
    this.reset();
    renderAll();

    alert("Produk berhasil ditambahkan!");
});

// TAMPILKAN PRODUK
function renderProducts() {
    $("productTable").innerHTML = "";

    products.forEach((p, index) => {
        const row = document.createElement("tr");

        [index + 1, p.nama, p.kategori, p.ukuran,
            p.stok, rupiah(p.harga)].forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            row.appendChild(td);
        });

        const td = document.createElement("td");
        const button = document.createElement("button");

        button.textContent = "Hapus";
        button.className = "btn-delete";

        button.onclick = () => {
            if (confirm("Hapus produk ini?")) {
                products = products.filter(item => item.id !== p.id);
                saveData();
                renderAll();
            }
        };

        td.appendChild(button);
        row.appendChild(td);
        $("productTable").appendChild(row);
    });
}

// PILIH PRODUK
function renderProductOptions() {
    const select = $("produkTerjual");
    const previous = select.value;

    select.innerHTML = '<option value="">Pilih produk</option>';

    products.filter(p => p.stok > 0).forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = `${p.nama} - ${rupiah(p.harga)} (Stok: ${p.stok})`;
        select.appendChild(option);
    });

    if (products.some(p => String(p.id) === previous && p.stok > 0)) {
        select.value = previous;
    }
}

// TAMBAH PENJUALAN
$("salesForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const id = Number($("produkTerjual").value);
    const jumlah = Number($("jumlahTerjual").value);
    const product = products.find(p => p.id === id);

    if (!product) {
        alert("Pilih produk!");
        return;
    }

    if (jumlah < 1 || jumlah > product.stok) {
        alert("Stok tidak mencukupi!");
        return;
    }

    sales.push({
        id: Date.now(),
        tanggal: $("tanggalPenjualan").value,
        pelanggan: $("namaPelanggan").value.trim(),
        produk: product.nama,
        jumlah: jumlah,
        harga: product.harga,
        total: product.harga * jumlah
    });

    product.stok -= jumlah;

    saveData();
    this.reset();
    $("tanggalPenjualan").value = new Date().toLocaleDateString("en-CA");

    renderAll();
    alert("Transaksi berhasil disimpan!");
});

// TABEL PENJUALAN
function renderSales() {
    $("salesTable").innerHTML = "";

    sales.forEach((s, i) => {
        const row = document.createElement("tr");

        [i + 1, s.tanggal, s.pelanggan,
            s.produk, s.jumlah, rupiah(s.total)].forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            row.appendChild(td);
        });

        $("salesTable").appendChild(row);
    });
}

// DASHBOARD
function renderDashboard() {
    const pendapatan = sales.reduce((sum, s) => sum + Number(s.total), 0);

    $("totalProduk").textContent = products.length;
    $("totalPenjualan").textContent = rupiah(pendapatan);
    $("totalTransaksi").textContent = sales.length;

    $("dashboardProducts").innerHTML = "";

    products.filter(p => sales.some(s => s.produk === p.nama))
        .forEach(p => {
            const row = document.createElement("tr");

            [p.nama, rupiah(p.harga)].forEach(value => {
                const td = document.createElement("td");
                td.textContent = value;
                row.appendChild(td);
            });

            $("dashboardProducts").appendChild(row);
        });

    drawChart();
}

// GRAFIK
function drawChart() {
    const canvas = $("salesChart");
    if (!canvas || !canvas.getContext) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (!width || !height) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const months = [];
    const values = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

        months.push(date.toLocaleDateString("id-ID", {month: "short"}));

        const total = sales
            .filter(s => {
                const d = new Date(s.tanggal + "T00:00:00");
                return d.getMonth() === date.getMonth() &&
                       d.getFullYear() === date.getFullYear();
            })
            .reduce((sum, s) => sum + Number(s.total), 0);

        values.push(total);
    }

    const max = Math.max(...values, 100000);
    const left = 55, right = 15, top = 20, bottom = 40;
    const cw = width - left - right;
    const ch = height - top - bottom;

    ctx.strokeStyle = "#ddd";
    ctx.fillStyle = "#555";
    ctx.font = "11px Arial";

    for (let i = 0; i <= 4; i++) {
        const y = top + ch * i / 4;

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(width - right, y);
        ctx.stroke();

        ctx.textAlign = "right";
        ctx.fillText(Math.round(max * (1 - i / 4) / 1000) + "k", left - 5, y + 4);
    }

    const points = values.map((v, i) => ({
        x: left + cw * i / 5,
        y: top + ch - (v / max) * ch
    }));

    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    ctx.stroke();

    points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#333";
        ctx.fill();

        ctx.textAlign = "center";
        ctx.fillText(months[i], p.x, height - 12);
    });
}

// LAPORAN
function renderReport() {
    const total = sales.reduce((sum, s) => sum + Number(s.total), 0);

    $("laporanPendapatan").textContent = rupiah(total);
    $("laporanTransaksi").textContent = sales.length;
    $("reportTable").innerHTML = "";

    sales.forEach((s, i) => {
        const row = document.createElement("tr");

        [i + 1, s.tanggal, s.pelanggan,
            s.produk, s.jumlah, rupiah(s.total)].forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            row.appendChild(td);
        });

        $("reportTable").appendChild(row);
    });
}

// PERBARUI SEMUA
function renderAll() {
    renderProducts();
    renderProductOptions();
    renderSales();
    renderDashboard();
    renderReport();
}

// MULAI APLIKASI
function startApp() {
    $("tanggalPenjualan").value = new Date().toLocaleDateString("en-CA");

    if (sessionStorage.getItem("isLogin") === "true") {
        $("loginPage").hidden = true;
        $("appPage").hidden = false;
        showPage("dashboard");
    } else {
        $("loginPage").hidden = false;
        $("appPage").hidden = true;
    }
}

window.addEventListener("resize", () => {
    if (sessionStorage.getItem("isLogin") === "true") {
        drawChart();
    }
});

startApp();