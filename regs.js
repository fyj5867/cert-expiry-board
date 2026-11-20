/* ════════════════════════════════════════════════════════════════
   法規矩陣資料（manual.html 的「法規」分頁使用）
   ※ 公開網站的一部分：只放通用法規條號與說明書慣用的英文原句。
     公司名、地址、證號、FCC ID、電池廠、機種對照一律不放這裡。
   欄位：
     reg  區域（all＝共通／CB）   cat  類別
     law  法規／標準              cl   條號
     req  說明書要寫什麼（中文）   txt  說明書慣用原句（英文或當地語言）
     on   什麼組態要帶入（c＝manual.html 的配置 S）
     trig 觸發條件（給人看）
     ver  both＝兩版都寫／ship＝只出貨版／cert＝只認證版／diff＝兩版寫法不同
     seen 參考手冊實際狀況：有／部分／無（無＝參考手冊都沒寫，要確認）
     chk  已對原文／部分對過／待對原文（2026/11/20 核對）
   ════════════════════════════════════════════════════════════════ */
(function(){
const radio = c => c.opt.wifi || c.opt.bt || c.opt.wwan || c.opt.nfc;
const R  = (c, k) => !!c.reg[k];
const ex = c => c.variant === "atex";

window.REG_CATS = [
  ["safety","Safety"],["emc","EMC"],["rf","RF／SAR"],["energy","能源"],
  ["env","環保"],["haz","防爆"],["cyber","資安"]
];
window.REG_AREAS = [
  ["all","共通（CB／IEC 62368-1）"],["us","美國"],["ca","加拿大"],["eu","歐盟"],["uk","英國"],
  ["jp","日本"],["tw","台灣"],["cn","中國"],["kr","韓國"],["br","巴西"],["iecex","IECEx（國際）"]
];

window.REGS = [
/* ───────────── 共通：IEC／UL 62368-1（CB）───────────── */
{id:"g-temp", reg:"all", cat:"safety", law:"IEC／UL 62368-1（認證條件）", cl:"報告 Conditions of Acceptability",
 req:"操作環境溫度。認證版寫安規申請條件（Ta 上限），出貨版寫規格書範圍。",
 txt:"Operating: -29°C ~ 40°C（認證版範例）／Operating: -29°C ~ 63°C（出貨版範例）",
 on:c => true, trig:"所有組態", ver:"diff",
 ship:"照 PP product spec 寫完整操作溫度範圍", cert:"寫安規申請的 Ta 上限（目前 40 °C）",
 seen:"部分", chk:"已對原文", note:"參考手冊：較新的認證版寫 40 °C，較舊的認證版照規格寫 60 °C。認證版的溫度要和送審報告一致。"},

{id:"g-pd", reg:"all", cat:"safety", law:"IEC／UL 62368-1（認證組態）", cl:"報告 Conditions of Acceptability",
 req:"充電方式。認證版只寫原廠 AC adapter（No PD），出貨版加 PD adapter 章節與充電器功率範圍。",
 txt:"Your tablet PC supports both AC adapter and PD adapter. … Ensure that the power output of the PD adapter is at least 65W or above. PD adapter is not included in the package.",
 on:c => true, trig:"所有組態", ver:"diff",
 ship:"寫 AC adapter＋PD adapter（USB-C／TBT4），附功率範圍", cert:"只寫原廠 AC adapter，不寫 PD 充電",
 seen:"有", chk:"已對原文", note:"EU 共用充電器的功率句見歐盟「共用充電器」一列。ATEX 版要注意和 Special Conditions 的指定 adapter 是否衝突。"},

{id:"g-port", reg:"all", cat:"safety", law:"IEC／UL 62368-1（送測組態）", cl:"報告 4.1.2／輸出額定",
 req:"認證版的 I/O 描述照送測組態寫（例：USB-C／TBT4 標 5V 0.5A，或寫成 USB 2.0），出貨版照規格書寫。",
 txt:"Type C x 1 (5V,0.5A)　Thunderbolt 4 x 1 (5V,0.5A)",
 on:c => true, trig:"所有組態", ver:"cert",
 seen:"部分", chk:"已對原文", note:"參考手冊：有的認證版把 USB-C／TBT4 標成 5V 0.5A，有的寫成 USB 2.0，出貨版都沒有這些標註。"},

{id:"g-batt", reg:"all", cat:"safety", law:"IEC 62368-1", cl:"Annex M（待對原文）",
 req:"電池更換警語，加上四項誤用情境（錯誤型號、丟火裡、高溫環境、低氣壓）。",
 txt:"BATTERY SAFETY — DANGER OF EXPLOSION IF BATTERY IS INCORRECTLY REPLACED. REPLACE ONLY WITH THE SAME OR EQUIVALENT TYPE RECOMMENDED BY THE MANUFACTURER. DISPOSE OF USED BATTERIES ACCORDING TO THE MANUFACTURER'S INSTRUCTIONS. ✓ Replacement of a battery with an incorrect type that can defeat a safeguard. ✓ Disposal of a battery into fire or a hot oven, or mechanically crushing or cutting of a battery, that can result in an explosion. ✓ Leaving a battery in an extremely high temperature surrounding environment … ✓ A battery subjected to extremely low air pressure …",
 on:c => true, trig:"所有組態", ver:"both", seen:"有", chk:"待對原文", note:"較舊的認證版沒有四項誤用情境。"},

{id:"g-adp", reg:"all", cat:"safety", law:"IEC 62368-1", cl:"Annex F（指示性防護，待對原文）",
 req:"限用專用 AC adapter。", txt:"CAUTION FOR ADAPTER — THE TABLET PC IS FOR USE WITH DEDICATED AC ADAPTER.",
 on:c => true, trig:"所有組態", ver:"both", seen:"有", chk:"待對原文", note:""},

{id:"g-hot", reg:"all", cat:"safety", law:"IEC 62368-1", cl:"Clause 9（表面溫度，待對原文）",
 req:"高溫點的使用提示。", txt:"For hotspots, users can easily avoid touching the device by changing the way the device is held.",
 on:c => true, trig:"所有組態", ver:"both", seen:"有", chk:"待對原文", note:"安規修改清單列為必補項。"},

{id:"g-earth", reg:"all", cat:"safety", law:"IEC 62368-1（北歐國家差異）", cl:"待對原文",
 req:"電源線要插有接地的插座。", txt:"The equipment power supply cord shall be connected to a socket-outlet with earthing connection.",
 on:c => true, trig:"所有組態", ver:"both", seen:"有", chk:"待對原文", note:"較舊的認證版沒有這句。"},

{id:"g-rj45", reg:"all", cat:"safety", law:"IEC 62368-1", cl:"待對原文",
 req:"RJ45 不可接電話線。", txt:"CAUTION FOR RJ45 — The RJ45 jack is not used for telephone line connection.",
 on:c => c.opt.rj45, trig:"有 RJ45", ver:"both", seen:"有", chk:"待對原文", note:""},

{id:"g-inst", reg:"all", cat:"safety", law:"IEC 62368-1", cl:"Annex F（待對原文）",
 req:"一般安全使用說明：放置、通風、日照、液體、清潔、不可自行拆修、長時間不用要拔 adapter。",
 txt:"Do not place this device on an unstable table or surface. … Do not cover the device or block the air ventilation holes … Keep liquids away from the device. … Do not attempt to disassemble or repair this device.",
 on:c => true, trig:"所有組態", ver:"both", seen:"有", chk:"待對原文", note:""},

{id:"g-las1", reg:"all", cat:"safety", law:"IEC 60825-1:2014", cl:"Clause 8／9（待對原文）",
 req:"Laser Class 1 標示（光碟機）。平板沒有光碟機，就不要留這段。",
 txt:"CLASS 1 LASER PRODUCT … TO PREVENT DIRECT EXPOSURE TO THE LASER BEAM, DO NOT TRY TO OPEN THIS ENCLOSURE.",
 on:c => c.opt.dvd, trig:"有 DVD／光碟機", ver:"both", seen:"部分", chk:"待對原文",
 note:"有一本平板出貨版仍留著 Class 1 那段，安規修改清單已規定刪除。"},

/* ───────────── 美國 ───────────── */
{id:"us-15b", reg:"us", cat:"emc", law:"FCC 47 CFR Part 15 Subpart B", cl:"§15.105(b)",
 req:"Class B 干擾聲明，附 4 項改善措施，要放在手冊明顯位置（§15.105(e) 允許只附電子版手冊）。",
 txt:"This equipment has been tested and found to comply with the limits for a Class B digital device, pursuant to part 15 of the FCC Rules. … — Reorient or relocate the receiving antenna. — Increase the separation between the equipment and receiver. — Connect the equipment into an outlet on a circuit different from that to which the receiver is connected. — Consult the dealer or an experienced radio/TV technician for help.",
 on:c => R(c,"us"), trig:"美國", ver:"both", seen:"有", chk:"已對原文", note:""},

{id:"us-1519", reg:"us", cat:"emc", law:"FCC 47 CFR Part 15", cl:"§15.19(a)(3)",
 req:"兩項條件聲明。法規要求印在機身 label（有螢幕可用 e-label）；走 SDoC 時，compliance information 也要放這句（§2.1077(a)(2)）。",
 txt:"This device complies with part 15 of the FCC Rules. Operation is subject to the following two conditions: (1) This device may not cause harmful interference, and (2) this device must accept any interference received, including interference that may cause undesired operation.",
 on:c => R(c,"us"), trig:"美國", ver:"both", seen:"有", chk:"已對原文", note:"e-label 的條件（§2.935）還沒讀原文。"},

{id:"us-sdoc", reg:"us", cat:"emc", law:"FCC 47 CFR Part 2", cl:"§2.1077(a)、(c)",
 req:"SDoC compliance information：(1) 品名、型號；(2) 符合 §15.19(a)(3) 的聲明；(3) 美國責任方的名稱、地址，以及電話或網路聯絡方式。可以放手冊或另附一張，也可以用電子版。",
 txt:"DECLARATION OF CONFORMITY according to FCC 47 Part 15 Subpart B … Responsible Party: [US responsible party] Address: … Phone Number: …",
 on:c => R(c,"us"), trig:"美國", ver:"both", seen:"部分", chk:"已對原文",
 note:"參考手冊中只有 1 本出貨版有。責任方必須在美國境內。"},

{id:"us-1521", reg:"us", cat:"rf", law:"FCC 47 CFR Part 15", cl:"§15.21",
 req:"未經核准的變更或改裝，可能使使用者喪失操作權。",
 txt:"Any changes or modifications not expressly approved by the party responsible for compliance could void the user's authority to operate the equipment.",
 on:c => R(c,"us"), trig:"美國", ver:"both", seen:"部分", chk:"已對原文", note:"部分出貨版沒有這句。"},

{id:"us-sar", reg:"us", cat:"rf", law:"FCC 47 CFR Part 1／Part 2", cl:"§1.1310(c)；§2.1093(d)(1)；KDB 447498",
 req:"SAR 1.6 W/kg（任 1 g 組織平均；四肢 4 W/kg／10 g），不可與其他發射器共置，並寫明在 FCC 網站用 FCC ID 查 SAR 的方式。",
 txt:"The SAR limit set by the FCC is 1.6W/kg. … SAR information on this device is on file with the FCC and can be found under the Display Grant section of www.fcc.gov/oet/ea/fccid after searching on FCC ID: [FCC ID]",
 on:c => R(c,"us") && radio(c), trig:"美國＋有無線", ver:"both", seen:"有", chk:"已對原文", note:"限值條文在 §1.1310(c)，§2.1093 只是引用。FCC ID 在「欄位」頁填，認證版可以先留空。"},

{id:"us-unii1", reg:"us", cat:"rf", law:"FCC 47 CFR Part 15 Subpart E", cl:"§15.407(a)(1)(iv)、(d)(3)、(d)(4)",
 req:"不要寫「5.15–5.25 GHz 限室內」：美國現行規定對 client 沒有這個限制。手冊的 indoor 聲明只適用 6 GHz 室內 AP 與 subordinate，平板（client）不用寫。",
 txt:"（應刪除的舊句）This device is operation in 5.15 – 5.25GHz frequency range, then restricted in indoor use only, Outdoor operations in the 5150~5250MHz is prohibit.",
 on:c => R(c,"us") && c.opt.wifi, trig:"美國＋Wi-Fi", ver:"both", seen:"部分", chk:"已對原文",
 note:"參考手冊中有 1 本寫了這句，美國版要刪；加拿大版要保留（RSS-247）。DFS slave 那句可以留。"},

{id:"us-6g", reg:"us", cat:"rf", law:"FCC 47 CFR Part 15 Subpart E", cl:"§15.407(d)(1)(v)",
 req:"5.925–7.125 GHz 不可用於控制無人機或與無人機通訊。",
 txt:"Operation of transmitters in the 5.925-7.125 GHz band is prohibited for control of or communications with unmanned aircraft systems.",
 on:c => R(c,"us") && c.opt.wifi6, trig:"美國＋6 GHz Wi-Fi", ver:"both", seen:"部分", chk:"已對原文",
 note:"有的機種模組支援 6 GHz，但手冊沒寫這句。KDB 987594 對 6 GHz client 手冊的要求還沒查。"},

{id:"us-ch", reg:"us", cat:"rf", law:"FCC（2.4 GHz 頻道設定）", cl:"待對原文",
 req:"美國／加拿大只能使用 2.4 GHz 的 channel 1~11。",
 txt:"For product available in the USA/Canada market, only channel 1~11 can be operated. Selection of other channels is not possible.",
 on:c => (R(c,"us") || R(c,"ca")) && c.opt.wifi, trig:"美國或加拿大＋Wi-Fi", ver:"both", seen:"部分", chk:"待對原文", note:""},

{id:"us-las2", reg:"us", cat:"safety", law:"21 CFR 1040.10／1040.11；IEC 60825-1:2014", cl:"1040.10(h)；IEC 60825-1 Clause 9（待對原文）",
 req:"Laser Class 2 標示，並寫出波長、光束發散角、脈衝持續時間與重複率、最大輸出。須做 CDRH 報備。",
 txt:"CLASS 2 LASER PRODUCT — IEC 60825-1:2014. Caution: Use of controls or adjustments or performance of procedures other than those specified herein may result in hazardous radiation exposure. Wavelength: … Beam divergence: … Pulse duration and repetition rate: … Maximum power or energy output: …",
 on:c => c.opt.scanner, trig:"有 Barcode scanner", ver:"both", seen:"有", chk:"待對原文",
 note:"Barcode scanner 是 FDA 管制品，一律做 CDRH 報備。加拿大要附法文。"},

{id:"us-coin", reg:"us", cat:"safety", law:"16 CFR Part 1263（Reese's Law）→ ANSI/UL 4200A", cl:"§1263.3（手冊警語在 UL 4200A Section 7，子條次待對原文）",
 req:"Coin／button cell 的手冊警語：回收、吞食致命、毒物中心、電池型號與電壓、不可充電，以及不可強制放電、充電、拆解、加熱或焚燒。2023 年起另要加「電池艙一定要鎖緊」那句。",
 txt:"1. Remove and immediately recycle or dispose of used batteries according to local regulations and keep away from children. … 2. Even used batteries may cause severe injury or death. 3. Call a local poison control center for treatment information. 4. The compatible battery type CR2032. 5. The nominal battery voltage DC 3V. 6. Non-rechargeable batteries are not to be recharged. 7. Do not force discharge, recharge, disassemble, heat above 60°C or incinerate. … 8. This product contains a non-replaceable button cell or coin battery. 9. Consult an authorized service center … ／ Always completely secure the battery compartment …",
 on:c => c.opt.coin, trig:"有 coin cell（RTC）", ver:"both", seen:"部分", chk:"部分對過",
 note:"參考手冊都沒有「電池艙鎖緊」那句。ATEX 版和較舊的認證版連 9 項都沒有。2026/11/18 公告擬改引 UL 4200A-2026，預計 2027/2/13 生效（前提是 12/18 前沒有重大反對意見）。"},

{id:"us-party", reg:"us", cat:"safety", law:"UL Listing（工廠識別）", cl:"UL 規定（待對原文）",
 req:"UL Party site number 與製造工廠名稱／地址。",
 txt:"Illustrate for Party site number [No.]: Party site number means that the Factory which manufactured this [product] … Factory Name: … Factory Address: …",
 on:c => R(c,"us"), trig:"美國（UL 證書）", ver:"both", seen:"部分", chk:"待對原文", note:"部分出貨版沒有這段。"},

{id:"us-date", reg:"us", cat:"safety", law:"UL（製造日期識別）", cl:"待對原文",
 req:"製造日期碼的格式說明（Date code format）。", txt:"ShopFloor Date Code Format Description … Second Date Code: Year (unit digit) … Third Date Code: Week …",
 on:c => R(c,"us"), trig:"美國（UL）", ver:"both", seen:"有", chk:"待對原文", note:"只有 UL 要求。"},

{id:"us-batt", reg:"us", cat:"env", law:"美國各州充電電池回收規定", cl:"待對原文",
 req:"鋰電池／鎳氫電池的回收處理說明。",
 txt:"THIS PRODUCT CONTAINS A LITHIUM-ION OR NICKEL-METAL HYDRIDE BATTERY. IT MUST BE DISPOSED OF PROPERLY. CONTACT LOCAL ENVIRONMENTAL AGENCIES FOR INFORMATION ON RECYCLING AND DISPOSAL PLANS IN YOUR AREA.",
 on:c => R(c,"us"), trig:"美國", ver:"both", seen:"有", chk:"待對原文", note:""},

{id:"us-estar", reg:"us", cat:"energy", law:"ENERGY STAR Program Requirements for Computers", cl:"待對原文",
 req:"為了符合 ENERGY STAR，出廠預設開啟 Wake on LAN，並說明對電池續航的影響。",
 txt:"To meet ENERGY STAR® requirements, Wake on LAN is enabled by default. If running on battery power, this may decrease battery run-time.",
 on:c => R(c,"us") && c.opt.estar, trig:"美國＋ENERGY STAR", ver:"both", seen:"有", chk:"待對原文", note:""},

{id:"us-p65", reg:"us", cat:"env", law:"California Proposition 65", cl:"27 CCR §25600 起（待對原文）",
 req:"Prop 65 警語（依材質測試結果決定）。",
 txt:"WARNING: This product can expose you to chemicals including lead, which is known to the State of California to cause cancer and birth defects or other reproductive harm. For more information go to www.P65Warnings.ca.gov.",
 on:c => R(c,"us") && c.opt.p65, trig:"美國＋勾選 Prop 65", ver:"both", seen:"無", chk:"待對原文", note:"參考手冊都沒寫，沿用說明書產生器原有內容。"},

{id:"us-c1d2", reg:"us", cat:"haz", law:"ANSI/UL 121201 第 9 版（與 CSA C22.2 No. 213-17 調和）", cl:"標準本文付費，條次待對原文",
 req:"C1D2 標示（Groups A B C D、T5，ATEX 版另含 Zone 2 IIC T5）、3 條爆炸危險警語，並寫出指定的電池型號。",
 txt:"WARNING EXPLOSION HAZARD — Class I, Division 2, Groups A, B, C, D, T Code T5 / Class I, Zone 2, Groups IIC, T5. WARNING - EXPLOSION HAZARD - SUBSTITUTION OF COMPONENTS MAY IMPAIR SUITABILITY FOR CLASS I, DIVISION 2. WARNING: TO PREVENT IGNITION OF A HAZARDOUS ATMOSPHERE, BATTERIES MUST ONLY BE CHARGED IN AN AREA KNOWN TO BE NON-HAZARDOUS. WARNING - EXPLOSION HAZARD - DO NOT CONNECT OR DISCONNECT WHILE CIRCUIT IS LIVE UNLESS AREA IS KNOWN TO BE NON-HAZARDOUS. Battery: [maker], P/N: [ ]",
 on:c => (R(c,"us") || R(c,"ca")), trig:"美國／加拿大（STD＋C1D2 與 ATEX 版都要）", ver:"both", seen:"部分", chk:"待對原文",
 note:"有一本 ATEX 版拿掉了 C1D2 警語，另一本有保留。有一個機種的規格表寫 C1D2 選配，但手冊沒有警語。STD 版要附鐵件鎖附圖（安規修改清單）。2021 修訂版另要求 Li-ion 攜帶式設備 IP54（公開摘要，待對原文）。英法警語原句請向 lab 索取標準原文確認。"},

{id:"us-nec", reg:"us", cat:"haz", law:"NEC Art. 500／505／506（ATEX 版另走 NEC 標示時）", cl:"待對原文",
 req:"Class I Zone 2 AEx ic IIC T4 Gc；Class I Div 2 Groups A–D T4；Zone 22 AEx ic IIIB T135°C Dc。要附 Control Drawing，寫明充電、換電池、I/O 的限制。",
 txt:"Class I, Zone 2, AEx ic IIC T4 Gc IP64 / Class I, Div 2, Groups A-D T4 / Zone 22, AEx ic IIIB T135°C Dc … Control Drawing: Ordinary non-hazardous locations — charging is allowed; Hazardous classified locations — do not charge or open the device inside the Ex-area.",
 on:c => ex(c) && (R(c,"us") || R(c,"ca")), trig:"ATEX 版＋美國／加拿大", ver:"both", seen:"部分", chk:"待對原文",
 note:"參考手冊中只有 1 本防爆品牌廠的手冊有。其他 ATEX 版走 UL 121201 的 C1D2。"},

/* ───────────── 加拿大 ───────────── */
{id:"ca-ices", reg:"ca", cat:"emc", law:"ICES-003 Issue 7；ICES-Gen Issue 2", cl:"ICES-Gen §6.3.3（標示）、§6.3.2.1（改放手冊）",
 req:"ICES 標示要英法雙語：CAN ICES-003(B)/NMB-003(B)，或 CAN ICES-3(B)/NMB-3(B)、CAN ICES(B)/NMB(B)。標示放機身或 e-label；要改放手冊須先取得 CEB 核准。整機已有 ISED 認證號碼時可省略。",
 txt:"CAN ICES-003(B)/NMB-003(B)",
 on:c => R(c,"ca"), trig:"加拿大", ver:"both", seen:"有", chk:"已對原文",
 note:"參考手冊用的舊句「This Class B digital apparatus complies with Canadian ICES-003」不符合現行規定（只有英文，也沒有 NMB）。"},

{id:"ca-gen", reg:"ca", cat:"rf", law:"RSS-Gen Issue 6", cl:"§9.3.2.1（免執照 notice）；§9.3.1（英法雙語）",
 req:"免執照無線設備的 notice，英法雙語；可放手冊、機身或兩者。可拆天線的聲明另見 §9.3.2.2。",
 txt:"This device complies with Industry Canada's licence-exempt RSSs. Operation is subject to the following two conditions: (1) This device may not cause interference; and (2) This device must accept any interference … / Le présent appareil est conforme aux CNR d'Industrie Canada applicables aux appareils radio exempts de licence. …",
 on:c => R(c,"ca") && radio(c), trig:"加拿大＋有無線", ver:"both", seen:"有", chk:"部分對過",
 note:"手冊引用的「RSS-Gen Issue 4 8.4」已過時，Issue 5 的過渡期約到 2027/7/30。現行 notice 句型（ISED 名稱）請對原文更新。"},

{id:"ca-102", reg:"ca", cat:"rf", law:"RSS-102 Issue 6", cl:"§4.5.1（雙語依 RSS-Gen §9.3.1）",
 req:"RF 暴露資訊，要在手冊明顯位置寫明 compliance separation distance（body-worn 距離），英法雙語。",
 txt:"This equipment complies with ISED radiation exposure limits set forth for an uncontrolled environment. … These requirements set a SAR limit of 1.6 W/kg averaged over one gram of tissue. … IC ID: [ ]",
 on:c => R(c,"ca") && radio(c), trig:"加拿大＋有無線", ver:"both", seen:"部分", chk:"已對原文",
 note:"參考手冊中只有 1 本有，而且只有英文，也沒寫測試距離。"},

{id:"ca-247", reg:"ca", cat:"rf", law:"RSS-247 Issue 4", cl:"§7.3.7（手冊）；§7.3.1.1（限制）",
 req:"5150–5250 MHz 只能在室內使用（英法雙語）。可拆式天線才要寫天線增益與 e.i.r.p.。§7.3.1.1 另規定不得在飛機上使用，建議一併寫。",
 txt:"Devices capable of operating in the band 5150–5250 MHz shall only be used indoors. … (for devices with detachable antenna(s)) the maximum antenna gain permitted …",
 on:c => R(c,"ca") && c.opt.wifi, trig:"加拿大＋Wi-Fi", ver:"both", seen:"部分", chk:"已對原文",
 note:"參考手冊中只有 1 本有，引用的 6.2.2.3 是舊版條號（Issue 3 過渡期約 2026/1/24 已結束）。"},

{id:"ca-uas", reg:"ca", cat:"rf", law:"RSS-248 Issue 3（6 GHz）", cl:"§7.1",
 req:"不可用於控制無人機或與無人機通訊；也不可在 oil platform、飛機上使用（5925–6425 MHz 在 10,000 ft 以上的大型飛機例外）。非 VLP 設備另加 automobiles、trains、maritime vessels。client 平板不用寫 indoor-only。",
 txt:"Devices shall not be used for control of or communications with unmanned aircraft systems.",
 on:c => R(c,"ca") && c.opt.wifi6, trig:"加拿大＋6 GHz Wi-Fi", ver:"both", seen:"部分", chk:"已對原文",
 note:"參考手冊中只有 1 本有 UAS 句，其他禁用場所都沒寫。"},

{id:"ca-fr", reg:"ca", cat:"safety", law:"CSA C22.2 No. 0；CSA C22.2 No. 62368-1", cl:"No. 0 §6.3.1（警告標示英法雙語）",
 req:"安全警語附法文：電池、adapter、RJ45、雷射。",
 txt:"SÉCURITÉ DES PILES — DANGER D'EXPLOSION SI LA PILE EST MAL REMPLACÉE. … / AVERTISSEMENT CONCERNANT L'ADAPTATEUR … / AVERTISSEMENT POUR RJ45 …",
 on:c => R(c,"ca"), trig:"加拿大", ver:"both", seen:"部分", chk:"部分對過",
 note:"依 NRTL 公開摘要。ATEX 版和較舊的認證版沒有電池法文警語。"},

{id:"ca-c1d2", reg:"ca", cat:"haz", law:"CSA C22.2 No. 213-17；CSA C22.2 No. 0", cl:"No. 0 §6.3.1（法文）；213 條次待對原文",
 req:"C1D2 的 3 條警語附法文 AVERTISSEMENT。",
 txt:"AVERTISSEMENT - RISQUE D'EXPLOSION – LA SUBSTITUTION DE COMPOSANTS PEUT RENDRE CE MATERIEL INACCEPTABLE POUR LES EMPLACEMENTS DE CLASSE I, DIVISION 2. … NE PAS BRANCHER OU DÉBRANCHER TANT QUE LE CIRCUIT EST SOUS TENSION, À MOINS QU'IL NE S'AGISSE D'UN EMPLACEMENT NON DANGEREUX.",
 on:c => R(c,"ca"), trig:"加拿大", ver:"both", seen:"部分", chk:"部分對過",
 note:"手冊的法文有空白錯位（SUBSTITUTIOND E、COMPOSANTSP EUTR），要校稿。"},

/* ───────────── 歐盟 ───────────── */
{id:"eu-dir", reg:"eu", cat:"rf", law:"RED 2014/53/EU（含 EMC 2014/30/EU、LVD 2014/35/EU）", cl:"Art. 10(9)；Annex VII（簡化 DoC）",
 req:"要隨附完整 DoC 或簡化 DoC。簡化 DoC 用 Annex VII 的固定句型，並附 DoC 全文網址。參考手冊只寫了「follows the provisions of …」。",
 txt:"Hereby, [Name of manufacturer] declares that the radio equipment type [designation of type of radio equipment] is in compliance with Directive 2014/53/EU. The full text of the EU declaration of conformity is available at the following internet address: [internet address]",
 on:c => R(c,"eu"), trig:"歐盟", ver:"both", seen:"無", chk:"已對原文",
 note:"Annex VI 是完整 DoC，簡化 DoC 在 Annex VII（Art. 18(2)）。另有 2 本出貨版和 1 本 ATEX 版連指令清單都沒有。"},

{id:"eu-band", reg:"eu", cat:"rf", law:"RED 2014/53/EU（經 (EU) 2022/2380 改寫）", cl:"Art. 10(8) 第 2 段",
 req:"說明書要寫各無線模組的 (a) 工作頻段、(b) 該頻段的最大發射功率（WLAN／BT／WWAN）。說明書語言的規定在同條第 4 段。",
 txt:"Europe: Model [WLAN module] Software Version … Maximum Power Output (2400 - 2483.5 MHz) … dBm … Europe: Model [WWAN module] … LTE frequency band support …",
 on:c => R(c,"eu") && radio(c), trig:"歐盟＋有無線", ver:"both", seen:"部分", chk:"已對原文", note:"有 3 本手冊（含 2 本 ATEX 版）沒有。"},

{id:"eu-5g6g", reg:"eu", cat:"rf", law:"RED 2014/53/EU；(EU) 2021/1067（6 GHz）", cl:"Art. 10(10)；2021/1067 Annex 表 1–2",
 req:"使用限制要讓人看得出受限的會員國或地區，法規要求放在包裝（手冊可以另外寫）。6 GHz 依實際模式寫：LPI（23 dBm）限室內；VLP（14 dBm）可在室內外使用，但不可用在無人機上。",
 txt:"In the 5150 - 5250MHz band: Indoor, including installations inside road vehicles, trains and aircraft, and limited outdoor use. … In the 5250 - 5350MHz band: Indoor use, inside buildings only. … In the 5945 - 6425 MHz band is restricted to indoor use only. This restriction exists in Belgium (BE), Bulgaria (BG), … Switzerland (CH), Iceland (IS), Liechtenstein (LI) and Norway (NO).",
 on:c => R(c,"eu") && c.opt.wifi, trig:"歐盟＋Wi-Fi", ver:"both", seen:"部分", chk:"已對原文",
 note:"參考手冊寫的「5945–6425 MHz 限室內」只對 LPI 成立。有一本只寫 5150~5350 MHz（含 TR），沒寫 6 GHz。包裝上的限制標示要另外確認。"},

{id:"eu-sar", reg:"eu", cat:"rf", law:"RED Art. 3(1)(a)；EN 50566／EN 62209-2", cl:"待對原文",
 req:"SAR 的測試距離。", txt:"The device complies with RF specifications when the device used at 1.5cm from your body.",
 on:c => R(c,"eu") && radio(c), trig:"歐盟＋有無線", ver:"both", seen:"部分", chk:"待對原文", note:"參考手冊中只有 1 本有。"},

{id:"eu-usbc", reg:"eu", cat:"env", law:"RED 修正指令 (EU) 2022/2380（共用充電器）", cl:"Annex Ia Part II(a)(b)；Art. 10(8) 第 3 段；Art. 3a(2)",
 req:"說明書要印充電器最小與最大功率的句子；充電超過 5 V、3 A 或 15 W 時，另加「USB PD fast charging」。這個 label 要印在說明書，也要印在包裝上或貼在包裝上。包裝上一定要有「是否附充電器」的 pictogram。平板 2024/12/28 起適用，筆電 2026/4/28 起。",
 txt:"The power delivered by the charger must be between min [x] Watts required by the radio equipment, and max [y] Watts in order to achieve the maximum charging speed. ／ USB PD fast charging",
 on:c => R(c,"eu") && c.cond.pdShip === "info", trig:"歐盟＋出貨版寫 PD", ver:"ship", seen:"部分", chk:"已對原文",
 note:"有 2 本出貨版寫了（15–65 W），句型和法規一致。這是歐盟出貨的法定項目，所以只放出貨版；認證版維持 No PD。"},

{id:"eu-rohs", reg:"eu", cat:"env", law:"RoHS 2011/65/EU＋(EU) 2015/863", cl:"Annex III 6(c)、7(a)、7(c)-I",
 req:"RoHS 符合聲明，並列出使用的豁免項。",
 txt:"This product complies with the EU RoHS Directive 2011/65/EU as amended by (EU) 2015/863. The above criteria do not apply to the RoHS exemptions. Exemption item: 7a, 7(c)-1 and 6c.",
 on:c => R(c,"eu"), trig:"歐盟", ver:"both", seen:"部分", chk:"已對原文",
 note:"參考手冊中只有 1 本有。6(c)、7(a)、7(c)-I 都在 2027/6/30 到期；細項 7(a)-I～VII、7(c)-V／VI 到 2027/12/31。2027 年中以後要更新豁免清單。"},

{id:"eu-reach", reg:"eu", cat:"env", law:"REACH (EC) 1907/2006", cl:"Art. 33(1)",
 req:"物品含 SVHC 超過 0.1 % w/w 時，要提供足夠資訊給收受者，至少要有物質名稱。附 ECHA 候選清單連結。",
 txt:"According to article 33 in EU REACH, article manufacturer has the obligation to disclose information of substances included in candidate list of SVHC contained in products. … http://echa.europa.eu/candidate-list-table/",
 on:c => R(c,"eu"), trig:"歐盟", ver:"both", seen:"部分", chk:"已對原文", note:"參考手冊中只有 1 本有。"},

{id:"eu-weee", reg:"eu", cat:"env", law:"WEEE 2012/19/EU", cl:"Art. 14(4)；Annex IX",
 req:"打叉垃圾桶符號與分類回收說明。",
 txt:"Symbol for the marking of electrical and electronic equipment — The symbol indicating separate collection for electrical and electronic equipment consists of the crossed-out wheeled bin …",
 on:c => R(c,"eu"), trig:"歐盟", ver:"both", seen:"有", chk:"已對原文",
 note:"手冊標題寫「ANNEX IV」，那是舊指令 2002/96/EC 的編號，2012/19/EU 是 Annex IX，要改。有一本 STD 出貨版的最新版沒有這段文字。"},

{id:"eu-bat", reg:"eu", cat:"env", law:"電池法規 (EU) 2023/1542", cl:"Art. 11；Art. 13；Art. 96(2)(a)",
 req:"可拆卸／可更換（Art. 11）2027/2/18 起適用。電池標示（Art. 13(1)–(3)）從 2026/8/18 或標示實施法規公布後 18 個月起適用，取較晚的日期。QR code 2027/2/18 起適用，分類回收符號 2025/8/18 起已適用。",
 txt:"（參考手冊都沒有；沿用說明書產生器原有段落）",
 on:c => R(c,"eu"), trig:"歐盟", ver:"both", seen:"無", chk:"已對原文",
 note:"ATEX 或專業用途沒有豁免。只有三種例外：11(2)(a) 常接觸水的可清洗設備、11(2)(b) 醫療影像／IVD、11(3) 電力或資料連續性。標示的實施法規看來還是草案。"},

{id:"eu-erp", reg:"eu", cat:"energy", law:"Ecodesign 2009/125/EC", cl:"—",
 req:"列在符合的指令清單中。", txt:"This product follows the provisions of the European Directive 2009/125/EC.",
 on:c => R(c,"eu"), trig:"歐盟", ver:"both", seen:"部分", chk:"待對原文", note:""},

{id:"eu-cyber", reg:"eu", cat:"cyber", law:"RED 委任法規 (EU) 2022/30（EN 18031）；CRA (EU) 2024/2847", cl:"2022/30 Art. 3；CRA Art. 13(18)、Art. 71(2)、Annex II",
 req:"資安資訊。2022/30 從 2025/8/1 起適用，EN 18031-1／-2／-3:2024 由 (EU) 2025/138 有條件引用。CRA 的 Art. 14 通報義務從 2026/9/11 起適用，其餘從 2027/12/11 起。CRA Annex II 要給使用者：製造商聯絡方式、弱點通報窗口與 CVD 政策、產品識別、用途與資安特性、可預見風險、DoC 網址、支援方式與截止日、安全使用、更新、停用方式（含如何關閉自動更新）、SBOM 位置（有提供時）。",
 txt:"Cybersecurity Information — 1. Security Update Period: The Tablet PC has a software and hardware support period of 5 years. Detailed information can be obtained from [URL] 2. Report on Security Issue: To report any vulnerability found with the Tablet PC, user can submit the report through our vulnerability reporting page at [URL]",
 on:c => R(c,"eu") && radio(c), trig:"歐盟＋有無線", ver:"both", seen:"部分", chk:"已對原文",
 note:"參考手冊只寫了支援期間和通報網址，CRA Annex II 的其他項目都沒有。較舊的認證版和防爆品牌廠的手冊連這段都沒有。修訂 CRA 的提案 COM(2026)590 還沒通過，沒有讀。"},

{id:"eu-atex", reg:"eu", cat:"haz", law:"ATEX 2014/34/EU；EN IEC 60079-0、EN 60079-11", cl:"Annex II 1.0.5（標示，待對原文）；1.0.6(a)（說明書）",
 req:"Ex 標示（Zone 2／22）、證書號碼、適用標準版本，以及「證書只涵蓋設計與測試」的聲明。",
 txt:"ATEX ZONE 2/22 CERTIFIED — II 3G Ex ic IIC T4 Gc / II 3D Ex ic IIIB T135°C Dc. Certificate number: [ ] Applicable standard: EN IEC 60079-0:2018, EN 60079-11:2012. This certificate of conformity only relates to the design and testing of the specified device Directive 2014/34/EU. Further requirements of this directive apply to manufacturing and the Placing this device on the market. …",
 on:c => ex(c) && R(c,"eu"), trig:"ATEX 版＋歐盟", ver:"both", seen:"有", chk:"部分對過",
 note:"防爆品牌廠的標示多了「op is」（含 laser scanner），也寫明 Ta −10～+55 °C。其他 ATEX 版的 Ex 段沒寫 Ta。"},

{id:"eu-atexsc", reg:"eu", cat:"haz", law:"ATEX 2014/34/EU（證書 X）", cl:"證書 Special Conditions for Safe Use",
 req:"Special Conditions 要和證書逐字一致：必須裝 ATEX 皮套、不可接外部裝置、只能在安全區用指定 adapter 充電（含充電溫度），並寫出電池型號警語。",
 txt:"Special Conditions for Safe Use • The tablet must be used with the Leather Bag which provided by [manufacturer] … • The tablet shall not be connected to any external device. • The tablet battery can only be recharged in a non-hazardous area using the [manufacturer] power adaptor, model [ ], rated at 19 V d.c., 3.42 A, and 65 W. … Charging is performed at an ambient temperature of 0 to 45 °C. Warning • USE ONLY [battery P/N] • DO NOT REPLACE OR CHARGE BATTERY IN EXPLOSIVE ENVIRONMENTS. • DO NOT USE THE DEVICE WITHOUT THE ATEX CASE IN EXPLOSIVE ENVIRONMENTS.",
 on:c => ex(c), trig:"ATEX 版", ver:"both", seen:"有", chk:"已對原文",
 note:"有 2 本 ATEX 出貨版同時寫了 PD adapter 充電，和「只能用指定 adapter」看起來衝突。"},

{id:"eu-atexcase", reg:"eu", cat:"haz", law:"ATEX 2014/34/EU（靜電防護）", cl:"證書要求",
 req:"抗靜電皮套的安裝說明。", txt:"Instruction — For this portable, battery powered, equipment, where the non-metallic materials are protected from charging or discharging by the provision of a dissipative protection (Leather case). The instructions shall provide guidance for the user on how to install the anti-static leather case.",
 on:c => ex(c), trig:"ATEX 版", ver:"both", seen:"有", chk:"已對原文", note:"參考手冊只放了證書原句，沒有實際的安裝步驟。"},

{id:"eu-atexfig", reg:"eu", cat:"haz", law:"ATEX／C1D2（結構要求）", cl:"—",
 req:"鐵件鎖附圖：I/O port、battery latch、Pogo pin 都要用鐵件加螺絲封住。",
 txt:"The I/O ports can only be used outside the hazardous area. Secure the I/O port, battery latch and pogo-pin metal brackets with the screws before entering the hazardous area.",
 on:c => ex(c) || c.opt.figstd, trig:"ATEX 版（STD＋C1D2 也要，見安規修改清單）", ver:"both", seen:"部分", chk:"已對原文", note:""},

{id:"eu-atexlang", reg:"eu", cat:"haz", law:"ATEX 2014/34/EU", cl:"Art. 6(8)；Annex II 1.0.6(a)",
 req:"說明書與安全資訊要用終端使用者容易理解的語言，由各會員國決定。",
 txt:"（防爆品牌廠另附多國語言 Instruction Manual：EN／DE／FR／ZH／CS／DA／ET／FI／EL…）",
 on:c => ex(c) && R(c,"eu"), trig:"ATEX 版＋歐盟", ver:"ship", seen:"部分", chk:"已對原文",
 note:"其他 ATEX 版只有英文。Art. 6(7) 管的是製造商名稱與聯絡方式，不是語言。"},

/* ───────────── 英國 ───────────── */
{id:"uk-mark", reg:"uk", cat:"rf", law:"UK Radio Equipment Regulations 2017（UKCA）", cl:"待對原文",
 req:"UKCA 標示與符合聲明（可以和 CE 合併成「CE & UKCA」章節）。",
 txt:"European Union CE & UKCA Marking and Compliance Notices …",
 on:c => R(c,"uk"), trig:"英國", ver:"both", seen:"部分", chk:"待對原文", note:"部分手冊有，部分沒有。"},

{id:"uk-5g6g", reg:"uk", cat:"rf", law:"Ofcom IR 2030（2026/10 版；SI 2021/493，經 SI 2026/1133 修正）", cl:"待對原文",
 req:"英國的 5 GHz、6 GHz 使用限制。",
 txt:"In accordance with the relevant statutory requirements in the UK, the 5150 to 5350 MHz and 5945 to 6425 MHz frequency range is restricted to indoor use only in the United Kingdom.",
 on:c => R(c,"uk") && c.opt.wifi, trig:"英國＋Wi-Fi", ver:"both", seen:"部分", chk:"待對原文",
 note:"參考手冊中只有 1 本有。Ofcom 網站擋自動讀取，原文沒讀到。據二手資料，英國 6 GHz 已改為 5925–6585 MHz：LPI 限室內，VLP 可在室內外使用。手冊句子可能要改。"},

{id:"uk-ukex", reg:"uk", cat:"haz", law:"UKEx（S.I. 2016/1107）", cl:"待對原文",
 req:"UKEx 證書與標示（可以寫「參照 ATEX 證書」）。", txt:"UKCA certificate: refer to ATEX certificate / UKCA marking: refer to ATEX marking",
 on:c => ex(c) && R(c,"uk"), trig:"ATEX 版＋英國", ver:"both", seen:"部分", chk:"待對原文", note:"只有防爆品牌廠的手冊有。"},

{id:"uk-psti", reg:"uk", cat:"cyber", law:"PSTI Act 2022／Product Security Regulations 2023（SI 2023/1007）", cl:"Sch 4 para 1(1)(e)；Sch 1 para 2–3；Sch 3 para 5(1)(c)",
 req:"Statement of compliance 要寫首次供貨時的 defined support period。弱點通報窗口是另一項公開義務（Sch 1 para 2），不放在 statement 裡。沒有行動網路功能的平板不適用 PSTI，有 LTE／5G 的才適用。",
 txt:"（參考手冊的 Cybersecurity Information 寫了支援 5 年與通報網址，沒有 PSTI 的 statement of compliance）",
 on:c => R(c,"uk") && c.opt.wwan, trig:"英國＋WWAN（LTE／5G）", ver:"both", seen:"部分", chk:"已對原文", note:""},

/* ───────────── 日本 ───────────── */
{id:"jp-vcci", reg:"jp", cat:"emc", law:"VCCI 運用規程", cl:"第9条の4（Class B）",
 req:"Class B 只要求標示 VCCI 標誌，不強制寫文字聲明（文字選項是 Class A 的規定，第10条）。",
 txt:"（參考手冊只看到「VCCI」標題，標誌應是圖片）",
 on:c => R(c,"jp"), trig:"日本", ver:"both", seen:"部分", chk:"已對原文", note:"有標誌就符合，不用另外補日文句。"},

{id:"jp-ex", reg:"jp", cat:"haz", law:"日本防爆検定", cl:"待對原文",
 req:"日本防爆證書與日文手冊。", txt:"（防爆品牌廠有日本防爆證書與日文 user manual）",
 on:c => ex(c) && R(c,"jp"), trig:"ATEX 版＋日本", ver:"both", seen:"部分", chk:"待對原文", note:"只有防爆品牌廠的手冊有。"},

/* ───────────── 台灣 ───────────── */
{id:"tw-eye", reg:"tw", cat:"safety", law:"BSMI「資訊、通訊及消費性電子產品之加註警語規範」", cl:"經標三字第10430007280號（2016/9/1 起）",
 req:"警語放在本體、說明書、外包裝；注意事項放在說明書、外包裝。文字要和公告完全一致（「警語內容：」「注意事項內容：」可以省略）。",
 txt:"警語：使用過度恐傷害視力　注意事項：（1）使用30分鐘請休息10分鐘。（2）未滿2歲幼兒不看螢幕，2歲以上每天看螢幕不要超過1小時。",
 on:c => R(c,"tw"), trig:"台灣", ver:"both", seen:"部分", chk:"已對原文",
 note:"只有 2 本 ATEX 版有，而且是英文意譯，第 1 點還漏了「休息 10 分鐘」。台灣市場要用中文原句。平板（8471.30）是否在公告範圍是假設，現行公告還沒讀。"},

{id:"tw-ncc", reg:"tw", cat:"rf", law:"NCC 低功率射頻器材技術規範 LP0002（109/7/1）", cl:"§3.8.2（另見 §5.7.9.1）",
 req:"低功率射頻器材警語（中文）。5 GHz 另有「應避免影響附近雷達系統之操作」（§5.7.9.1）。",
 txt:"取得審驗證明之低功率射頻器材，非經核准，公司、商號或使用者均不得擅自變更頻率、加大功率或變更原設計之特性及功能。低功率射頻器材之使用不得影響飛航安全及干擾合法通信；經發現有干擾現象時，應立即停用，並改善至無干擾時方得繼續使用。前述合法通信，指依電信管理法規定作業之無線電通信。低功率射頻器材須忍受合法通信或工業、科學及醫療用電波輻射性電機設備之干擾。",
 on:c => R(c,"tw") && radio(c), trig:"台灣＋有無線", ver:"both", seen:"無", chk:"部分對過",
 note:"參考手冊都沒有。原文是從 NCC PDF 的第三方副本讀的。2024 年修正的 6 GHz 條文（§5.13）還沒讀。"},

{id:"tw-rohs", reg:"tw", cat:"env", law:"BSMI 公告「其他檢驗規定」（CNS 15663 §5）", cl:"公告條文（CNS 本文付費未讀）",
 req:"限用物質含有情況，標示在本體、包裝、標貼或說明書任一處即可；也可以放網頁，在上述任一處寫明網址。",
 txt:"（參考手冊都沒有）",
 on:c => R(c,"tw"), trig:"台灣", ver:"both", seen:"無", chk:"部分對過", note:"讀的是影音與充電器類公告，資訊類草案是同一條文。"},

/* ───────────── 中國 ───────────── */
{id:"cn-rohs", reg:"cn", cat:"env", law:"GB/T 26572；SJ/T 11364", cl:"待對原文",
 req:"有害物質名稱及含量標示表、環保使用期限（EFUP）。", txt:"（參考手冊都沒有；簡中手冊只是英文版的翻譯）",
 on:c => R(c,"cn"), trig:"中國", ver:"both", seen:"無", chk:"待對原文", note:""},

{id:"cn-ex", reg:"cn", cat:"haz", law:"CCC（防爆電氣）", cl:"待對原文",
 req:"CCC 防爆證書與標示。", txt:"（防爆品牌廠有 CCC 防爆證書與簡中 Instruction Manual）",
 on:c => ex(c) && R(c,"cn"), trig:"ATEX 版＋中國", ver:"both", seen:"部分", chk:"待對原文", note:"只有防爆品牌廠的手冊有。"},

/* ───────────── 韓國／巴西／IECEx（防爆）───────────── */
{id:"kr-ex", reg:"kr", cat:"haz", law:"KCs（防爆）", cl:"待對原文",
 req:"KCs 氣體與粉塵兩張證書，附韓文說明書。", txt:"（防爆品牌廠有 KCs GAS／DUST 證書與韓文 Instruction Manual）",
 on:c => ex(c) && R(c,"kr"), trig:"ATEX 版＋韓國", ver:"both", seen:"部分", chk:"待對原文", note:"只有防爆品牌廠的手冊有。"},

{id:"br-ex", reg:"br", cat:"haz", law:"INMETRO（防爆）", cl:"待對原文",
 req:"INMETRO 防爆證書與標示。", txt:"（防爆品牌廠有 INMETRO 證書）",
 on:c => ex(c) && R(c,"br"), trig:"ATEX 版＋巴西", ver:"both", seen:"部分", chk:"待對原文", note:"只有防爆品牌廠的手冊有。"},

{id:"iecex", reg:"iecex", cat:"haz", law:"IECEx；IEC 60079-0／-11（-28 op is）", cl:"待對原文",
 req:"IECEx 證書號碼、Ex 標示與 Ta 範圍。", txt:"IECEx Certificate of Conformity no.: [ ] Ex-marking: Ex ic op is IIC T4 Gc IP64 / Ex ic op is IIIB T135°C Dc IP64 Ambient temperature: -10 °C ≤ Ta ≤ +55 °C",
 on:c => ex(c) && R(c,"iecex"), trig:"ATEX 版＋IECEx", ver:"both", seen:"部分", chk:"待對原文",
 note:"只有防爆品牌廠的手冊有。「op is」應是因為裝了 laser scanner（IEC 60079-28），這是推論，待確認。"}
];
})();
