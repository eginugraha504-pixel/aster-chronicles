/* =====================================================================
   KONFIG & BALANCING — ubah angka di sini tanpa menyentuh logika game
   ===================================================================== */
const SAVE_KEY='aster_chronicles_v2';      // ganti versi -> progres pemain direset
const START={gems:1000,gold:8000,stam:60};  // modal awal pemain baru

// Gacha (berlaku untuk banner hero & senjata)
const RATES={3:3,2:19,1:78};               // persen per bintang, total 100
// Rate On / Rate Off (banner rate-up): saat dapat ★3, peluang item rate-up = RATE_UP[jenis].
// Kalau kalah (Rate Off -> ★3 lain), ★3 BERIKUTNYA di banner rate-up jenis yang sama DIJAMIN item rate-up.
// Status jaminan terbawa antar banner rate-up (hero dan senjata dihitung terpisah).
const RATE_UP={hero:.5,wpn:.75};
const PITY=80;
// Soft pity: mulai tarikan ke-SOFT_PITY.at, peluang ★3 naik SOFT_PITY.step% tiap tarikan (sampai pasti di PITY)
const SOFT_PITY={at:66,step:6};                             // ★3 dijamin tiap N tarikan (pity hero & senjata terpisah)
const COST1=300,COST10=2700;               // harga permata
const DUPE_MAX=5;                          // maks Limit Break hero / Penempaan senjata
const BADGE_DUPE=[0,1,5,25];              // Lencana Ksatria dari hero duplikat setelah Limit Break maks, per bintang
// Duplikat senjata & perlengkapan TIDAK otomatis jadi penempaan: disimpan sebagai salinan (systems/weapons.js)

// Kesulitan: rekomendasi CP & kekuatan musuh tumbuh g^n (n = urutan tahap 0..24)
// hp/atk/def = stat dasar musuh di n=0 (dikalibrasi lewat simulasi: tim dengan CP = rekomendasi menang ~65%)
// Kekuatan musuh & CP disarankan ditentukan titik acuan per urutan tahap n (0 = 1-1 ... 24 = 5-5),
// di antaranya diinterpolasi (skala log). Titik CP disarankan = CP tim yang menang ~70% (hasil kalibrasi simulasi).
// atkExp: ATK musuh tumbuh g^atkExp (lebih lambat dari HP) supaya tahap akhir tidak jadi 'sekali pukul mati'
const DIFF={hp:975,atk:165,def:28,atkExp:.85,
 pow:[[0,1],[4,2.6],[9,9.6],[14,17.5],[19,25.5],[24,33]],
 rec:[[0,1500],[4,4400],[9,9800],[14,16100],[19,21500],[24,29000]]};
function lerpLog(A,n){if(n<=A[0][0])return A[0][1];for(let i=1;i<A.length;i++)if(n<=A[i][0]){const[x0,y0]=A[i-1],[x1,y1]=A[i],t=(n-x0)/(x1-x0);return Math.exp(Math.log(y0)+(Math.log(y1)-Math.log(y0))*t)}return A[A.length-1][1]}
const diffG=n=>lerpLog(DIFF.pow,n);
const recCP=n=>Math.round(lerpLog(DIFF.rec,n)/50)*50;
// Tahap cerita (n = urutan tahap 0..24)
// cost/gems: [tahap biasa, tahap bos]   gold/exp: a + b × n   (permata hanya dari kemenangan pertama)
const STAGE_RW={cost:[6,8],gems:[60,150],gold:[320,160],exp:[10,3]};
// Level hero dibatasi level akun: maks = level akun × 2 + 10
// peluang pemanah/penyihir MUSUH mengincar hero ber-HP terendah (sisanya target acak)
const ENEMY_FOCUS=.45;
// hero yang masih hidup memulihkan sebagian HP setiap ganti gelombang (tim tanpa healer tetap punya peluang)
const WAVE_HEAL=.25;
// pengali stat bos dibanding musuh biasa di tahap yang sama
const BOSS_MUL={hp:4.5,atk:1.15,def:1.3};
const HERO_LV_BY_ACC=lv=>lv*2+10;

// Stamina
const STAM_MAX=60,STAM_MS=120000;          // +1 stamina tiap 2 menit

// Stat hero
const RAR=[0,1,1.35,1.75];                 // pengali stat per bintang
const BASE_STAT={hp:900,atk:85,def:40};
const LV_GROWTH=.09,LB_GROWTH=.1;          // per level / per limit break
const MAX_LV=[0,30,40,50],LB_LV=2;         // level maks per bintang, +2 per LB
const BASE_CRIT=10;                        // % crit dasar

// Senjata
const WPN_REFINE=.1,WPN_LV_GROWTH=.03;     // +10%/penempaan, +3% ATK senjata per level hero

// Bonus CP tim
const CP_BONUS={elem:{2:.05,3:.1,4:.15},balance:.12,full:.03,sig:.02};

// Level & Limit Break senjata (material dari Dungeon)
const WPN_LV_CAP=[20,30,40,50,60];        // level maks per tahap Limit Break (0..4)
const WPN_LB_MAX=4;
const WPN_ATK_GROWTH=.08,WPN_LB_BONUS=.1,WPN_SUB_LB=.15; // +8% ATK/level, +10% ATK & +15% sub-stat per Limit Break
const WPN_EXP_GOLD=.4;                    // emas per 1 EXP senjata
const wExpNeed=(lv,r)=>Math.round((60+lv*25)*[0,1,1.4,1.8][r]);
// biaya Limit Break per bintang senjata, per tahap (0->1 .. 3->4)
const WPN_LB_COST={
 1:[{gem1:3,gold:3000},{gem1:6,gold:6000},{gem1:8,gem2:1,gold:12000},{gem1:12,gem2:3,gold:20000}],
 2:[{gem1:5,gold:5000},{gem1:8,gem2:2,gold:10000},{gem2:5,gold:18000},{gem2:8,gem3:1,gold:30000}],
 3:[{gem1:8,gem2:1,gold:8000},{gem2:4,gold:15000},{gem2:6,gem3:2,gold:25000},{gem2:10,gem3:4,gold:40000}]};
