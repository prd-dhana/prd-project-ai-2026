const urlPage1 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0YgI2aCwhv3X9Xnr3mHGTrwuecgUSOSCdPe386FTRibXNYW-Cb5piYnlxlTd0tcIkp_m3PXaUMWLj/pub?gid=0&single=true&output=csv';
const stepWeights = [5, 5, 10, 3, 2, 50, 20, 5]; 

async function loadProgress() {
    try { // เพิ่ม try ครอบไว้
        const response = await fetch(urlPage1);
        const data = await response.text(); 
        const rows = data.split('\n'); // เปลี่ยนจาก text เป็น data ให้ตรงกัน
            
        let currentProgress = 0;
        let lastFinishedStep = "ยังไม่ได้เริ่มดำเนินการ";

        // วนลูปเช็คแถวที่ 2 ถึง 9 (ตามตาราง 8 ขั้นตอน)
        for (let i = 0; i < 8; i++) {
            if (!rows[i + 1]) continue; // กันเหนียวถ้าแถวว่าง
            const columns = rows[i + 1].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            // คอลัมน์ G คือ Index 6
            const isChecked = columns[6] ? columns[6].trim().toUpperCase() : ""; 
            const taskName = columns[1] ? columns[1].replace(/"/g, '') : ""; // ล้างเครื่องหมายคำพูดออก

            if (isChecked === "TRUE") {
                currentProgress += stepWeights[i];
                lastFinishedStep = taskName;
            }
        }

        // แสดงผลบนหน้าเว็บ
        const bar = document.getElementById('progress-bar');
        if (bar) {
            bar.style.width = currentProgress + '%';
            bar.innerHTML = `<b>${currentProgress}%</b>`;
        }
        
        const statusDetail = document.getElementById('status-detail');
        if (statusDetail) {
            statusDetail.innerHTML = `<strong>สถานะล่าสุด:</strong> ${lastFinishedStep}`;
        }
        const cleanShortDate = (str) => {
        if (!str) return ""; // ถ้าไม่มีข้อมูลให้ส่งค่าว่างกลับไป ไม่ให้โปรแกรมพัง
            const cleanStr = str.replace(/"/g, '').trim();
            const parts = cleanStr.split('/');
    
        // ถ้ามีส่วนประกอบ 3 ส่วน (วัน/เดือน/ปี) ให้เอาแค่ 2 ส่วนแรก
        if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`;
        }
        return cleanStr; // ถ้าไม่ใช่รูปแบบวันที่ให้คืนค่าเดิม
        };

        const roadmapList = document.getElementById('roadmap-list');
        roadmapList.innerHTML = ''; // ล้างข้อมูลเก่าก่อน

        for (let i = 0; i < 8; i++) {
            const columns = rows[i + 1].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const taskName = columns[1].replace(/"/g, '');
            const startDate = cleanShortDate(columns[3]);
            const endDate = cleanShortDate(columns[4]);
            const duration = `${startDate} - ${endDate}`;
            const statusValue = columns[7] ? columns[7].trim().replace(/"/g, '') : "";
            const employeeName = columns[2].replace(/"/g, '');
            let statusClass = "";
        if (statusValue === "ตามแผน") statusClass = "success";
        else if (statusValue === "กำลังดำเนินการ") statusClass = "processing";
        else if (statusValue === "ล่าช้า") statusClass = "delayed";

            // สร้าง HTML สำหรับแต่ละแถว
            const rowHTML = `
            <div class="roadmap-row">
                <div class="col-task">${taskName}</div>
                <div class="col-employee">${employeeName}</div>
                <div class="col-duration">${duration}</div>
                <div class="col-status"><span class="badge ${statusClass}">${statusValue || 'รอดำเนินการ'}</span></div>
                </div>
            </div>
        `;
        roadmapList.innerHTML += rowHTML;
        }

    } catch (error) {
        console.error("Error fetching data:", error);
        const statusDetail = document.getElementById('status-detail');
        if (statusDetail) statusDetail.innerText = "โหลดข้อมูลไม่สำเร็จ";
    }
}

// เรียกชื่อฟังก์ชันให้ตรงกับที่ตั้งไว้ข้างบน
loadProgress();