const URL_SHEET = "https://docs.google.com/spreadsheets/d/1CW86caoK90fXyxvLmSeZH9XQ_fL1_eI-kvttMxE4hRY/gviz/tq?tqx=out:json&sheet=INDONESIA";
const bulanNama = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const now = new Date().getMonth();

let jurnal = [];
let table;

/* ================= UTIL ================= */
function getNamaJurnal(url) {
    try {
        if (!url || typeof url !== "string") return "JURNAL";
        url = url.trim();
        if (url.includes("index.php/")) {
            let slug = url.split("index.php/")[1].split("/")[0].replace(/[-_]/g, " ").trim();
            if (slug.length > 0) return slug.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        }
        const u = new URL(url);
        const path = u.pathname.split("/").filter(p => p.length > 0);
        if (path.length === 1) {
            let slug = path[0].replace(/[-_]/g, " ").trim();
            if (slug.length > 0) return slug.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        }
        return "JURNAL";
    } catch (e) {
        return "JURNAL";
    }
}

function formatRupiah(num) {
    return "Rp" + num.toLocaleString("id-ID");
}

/* ================= INIT ================= */
$(document).ready(function () {
    fetchData();
});

function fetchData() {
    fetch(URL_SHEET)
        .then(r => r.text())
        .then(t => {
            const json = JSON.parse(t.substring(t.indexOf("{"), t.lastIndexOf("}") + 1));
            json.table.rows.slice(1).forEach(r => {
                if (!r.c || !r.c[2]?.v) return;
                let bulan = [];
                for (let i = 0; i < 12; i++) bulan.push(r.c[5 + i]?.v === 1 ? 1 : 0);
                jurnal.push({
                    nama: getNamaJurnal(r.c[2].v),
                    sinta: r.c[1]?.v || "-",
                    link: r.c[2].v,
                    fee: r.c[3]?.v || 0,
                    subject: r.c[17]?.v || "-",
                    bulan
                });
            });

            // Render All Components
            renderCards();
            renderChart();
            renderStats();
            renderTable();

            // Remove Loader if exists (optional)
        })
        .catch(e => console.error("Error fetching data:", e));
}

/* ================= RENDER CARDS (Terbitan) ================= */
function renderCards() {
    const container = document.getElementById("bagianTerbitan");
    container.innerHTML = "";

    for (let o = 0; o < 6; o++) {
        const m = (now + o) % 12;
        const listJurnal = jurnal.filter(j => j.bulan[m] === 1);

        const title = o === 0 ? "Terbit Bulan Ini" : `${o} Bulan Lagi`;
        const badgeColor = o === 0 ? "bg-primary" : "bg-secondary";

        let html = `
        <div class="col-xl-4 col-md-6 animate-up delay-${(o + 1) * 100}">
            <div class="glass-card h-100 d-flex flex-column p-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="fw-bold mb-0 text-primary">${title}</h5>
                    <span class="badge ${badgeColor}">${bulanNama[m]}</span>
                </div>
                
                <div class="overflow-auto flex-grow-1 pe-2" style="max-height: 400px;">
                    ${listJurnal.length > 0 ? listJurnal.map(j => `
                        <div class="card border-0 shadow-sm mb-3 p-3 bg-white bg-opacity-50">
                            <div class="d-flex justify-content-between">
                                <h6 class="fw-bold text-truncate" style="max-width: 70%;">${j.nama}</h6>
                                <span class="badge bg-warning text-dark">S${j.sinta}</span>
                            </div>
                            <small class="text-muted d-block mb-2">${j.subject}</small>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="text-success fw-bold small">${formatRupiah(j.fee)}</span>
                                <a href="${j.link}" target="_blank" class="btn btn-sm btn-outline-primary rounded-pill px-3">
                                    <i class="bi bi-box-arrow-up-right"></i> Akses
                                </a>
                            </div>
                        </div>
                    `).join("") : '<p class="text-center text-muted my-5">Tidak ada data jadwal terbit.</p>'}
                </div>
                <div class="mt-3 text-center border-top pt-2">
                    <small class="text-muted">Total: <b>${listJurnal.length}</b> Jurnal</small>
                </div>
            </div>
        </div>`;
        container.innerHTML += html;
    }
}

/* ================= RENDER CHART ================= */
function renderChart() {
    let data = Array(12).fill(0);
    jurnal.forEach(j => j.bulan.forEach((v, i) => { if (v === 1) data[i]++; }));

    // Highlight current month
    const colors = data.map((_, i) => i === now ? '#4f46e5' : '#c7d2fe');

    new Chart(document.getElementById("chartBulanan"), {
        type: "bar",
        data: {
            labels: bulanNama,
            datasets: [{
                label: 'Jumlah Jurnal',
                data,
                backgroundColor: colors,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#1f2937',
                    bodyColor: '#1f2937',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                }
            },
            scales: {
                y: { grid: { borderDash: [4, 4], color: '#e5e7eb' }, beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    });
}

/* ================= RENDER STATS ================= */
function renderStats() {
    const total = jurnal.length;
    let sintaAll = {};
    let sintaNow = {};
    let feesNow = [];

    jurnal.forEach(j => {
        sintaAll[j.sinta] = (sintaAll[j.sinta] || 0) + 1;
        if (j.bulan[now] === 1) {
            sintaNow[j.sinta] = (sintaNow[j.sinta] || 0) + 1;
            feesNow.push(j.fee);
        }
    });

    // 1. Total Jurnal
    animateValue("statTotal", 0, total, 1000);

    // 2. SINTA All Chart (Small Pie or Text) - Using Text for now
    const sintaAllHtml = Object.keys(sintaAll).sort().map(s =>
        `<span class="badge badge-soft-primary me-1 mb-1">S${s}: ${sintaAll[s]}</span>`
    ).join("");
    document.getElementById("statSintaAll").innerHTML = sintaAllHtml;

    // 3. APC Stats
    document.getElementById("statMax").innerText = feesNow.length ? formatRupiah(Math.max(...feesNow)) : "-";
    document.getElementById("statMin").innerText = feesNow.length ? formatRupiah(Math.min(...feesNow)) : "-";

    // 4. Sinta Month
    const sintaNowHtml = Object.keys(sintaNow).sort().map(s =>
        `<span class="badge badge-soft-success me-1 mb-1">S${s}: ${sintaNow[s]}</span>`
    ).join("");
    document.getElementById("statSintaNow").innerHTML = sintaNowHtml;
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

/* ================= RENDER TABLE ================= */
function renderTable() {
    // Populate Filters
    const fBulan = $('#filterBulan').empty();
    bulanNama.forEach(b => fBulan.append(`<option value="${b}">${b}</option>`));

    const fSinta = $('#filterSinta').empty().append('<option value="">Filter SINTA</option>');
    [...new Set(jurnal.map(j => j.sinta))].sort().forEach(s => {
        fSinta.append(`<option value="${s}">SINTA ${s}</option>`);
    });

    // Custom Filter Logic
    $.fn.dataTable.ext.search.push(function (settings, data) {
        let bulanDipilih = $('#filterBulan').val();
        const sintaDipilih = $('#filterSinta').val();
        const minApc = $('#filterApcMin').val();
        const maxApc = $('#filterApcMax').val();

        if (bulanDipilih && !Array.isArray(bulanDipilih)) bulanDipilih = [bulanDipilih];
        const sinta = data[2];
        const apc = parseFloat(data[4].replace(/[^\d]/g, '')) || 0; // Fix currency parsing
        const bulanTerbit = data[6];

        if (bulanDipilih && bulanDipilih.length > 0) {
            let cocok = false;
            for (let b of bulanDipilih) { if (bulanTerbit.includes(b)) { cocok = true; break; } }
            if (!cocok) return false;
        }
        if (sintaDipilih && sinta !== sintaDipilih) return false;
        if (minApc && apc < parseFloat(minApc)) return false;
        if (maxApc && apc > parseFloat(maxApc)) return false;

        return true;
    });

    // Bind Inputs
    $('#filterBulan, #filterSinta, #filterApcMin, #filterApcMax').on('change keyup', function () {
        table.draw();
    });

    // Build Table Body
    const body = jurnal.map((j, i) => {
        const bln = j.bulan.map((v, idx) => v ? bulanNama[idx] : "").filter(Boolean).join(", ");
        return `
            <tr>
                <td class="text-center">${i + 1}</td>
                <td class="fw-semibold text-dark">${j.nama}</td>
                <td><span class="badge ${j.sinta <= 2 ? 'bg-success' : 'bg-warning'} text-white">S${j.sinta}</span></td>
                <td><a href="${j.link}" target="_blank" class="btn btn-sm btn-light text-primary"><i class="bi bi-link-45deg"></i> Link</a></td>
                <td>${formatRupiah(j.fee)}</td>
                <td class="small text-muted">${j.subject}</td>
                <td class="small">${bln}</td>
            </tr>`;
    }).join("");

    $("#tableAll tbody").html(body);

    // Init DataTable
    if ($.fn.DataTable.isDataTable('#tableAll')) {
        table.destroy();
    }

    table = $("#tableAll").DataTable({
        pageLength: 10,
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Cari Jurnal...",
            paginate: { next: ">", previous: "<" }
        },
        dom: '<"d-flex justify-content-between mb-3"lf>rt<"d-flex justify-content-between mt-3"ip>',
    });
}
