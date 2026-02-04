const urlPage2 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0YgI2aCwhv3X9Xnr3mHGTrwuecgUSOSCdPe386FTRibXNYW-Cb5piYnlxlTd0tcIkp_m3PXaUMWLj/pub?gid=139768779&single=true&output=csv';

async function initDetailsPage() {
    console.log("เริ่มทำงาน: initDetailsPage"); // เช็คว่าสคริปต์เริ่มวิ่งไหม
    
    const urlParams = new URLSearchParams(window.location.search);
    const targetTopic = urlParams.get('topic');
    console.log("หัวข้อที่ดึงจาก URL:", targetTopic);

    const titleElement = document.getElementById('display-topic-title');
    const logContainer = document.getElementById('log-container');

    if (!targetTopic) {
        if (titleElement) titleElement.innerText = "ไม่พบข้อมูลหัวข้อใน URL";
        return;
    }

    if (titleElement) titleElement.innerText = targetTopic;

    try {
        const response = await fetch(urlPage2);
        const data = await response.text();
        // ปรับการตัดบรรทัดให้รองรับทั้ง \n และ \r\n
        const rows = data.split(/\r?\n(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        console.log("จำนวนแถวที่ดึงได้จาก Sheet:", rows.length);
        
        let htmlContent = "";
        const cleanTarget = targetTopic.replace(/\s/g, '');

        const dataRows = rows.slice(1).reverse();

        dataRows.forEach((row, index) => {
            const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (columns.length < 5) return;

            const topicInSheet = columns[1] ? columns[1].replace(/"/g, '').trim() : "";
            const cleanSheetTopic = topicInSheet.replace(/\s/g, '');

            // บรรทัดนี้จะช่วยให้เห็นใน Console ว่ามันเทียบชื่ออะไรกันอยู่
            if (index < 5) console.log(`กำลังเทียบ: [${cleanSheetTopic}] กับ [${cleanTarget}]`);

            if (cleanSheetTopic === cleanTarget) {
                console.log("เจอข้อมูลที่ตรงกันแล้ว!");
                const dateRaw = columns[0].replace(/"/g, '').trim();
                const staff = columns[2].replace(/"/g, '').trim();
                const step = columns[3].replace(/"/g, '').trim();
                const detail = columns[4].replace(/"/g, '').trim();
                const imageHtml = columns[5] ? columns[5].replace(/"/g, '') : "";

                const dateParts = dateRaw.split('/');
                const displayDate = dateParts.length >= 2 ? `${parseInt(dateParts[0])}/${parseInt(dateParts[1])}` : dateRaw;

                htmlContent += `
                    <div class="log-entry">
                        <div class="log-date">${displayDate}</div>
                        <div class="log-body">
                            <div class="log-tags">
                                <span class="badge-step">${step}</span>
                                <span class="badge-staff">${staff}</span>
                            </div>
                            <div class="log-text" style="white-space: pre-wrap;">${detail}</div>
                            <div class="log-images-grid">${imageHtml}</div>
                        </div>
                    </div>
                `;
                
            }
        });

        if (logContainer) {
            logContainer.innerHTML = htmlContent || "<p style='text-align:center; color:#999; padding:20px;'>ไม่พบข้อมูลที่ตรงกับหัวข้อนี้</p>";
            logContainer.onclick = function(e) {
                if (e.target.tagName === 'IMG') {
                    const modal = document.getElementById('imageModal');
                    const modalImg = document.getElementById('modalImg');
                    const modalVideo = document.getElementById('modalVideo');
                    if (modal && modalImg) {
                        modal.style.display = "flex";
                        modalImg.style.display = "block";
                        modalVideo.style.display = "none";
                        modalImg.src = e.target.src;
                        modalVideo.src = ""; // ล้างค่าเดิมของวิดีโอ
                    }
                    else if (e.target.tagName === 'IFRAME') {
                    // กรณีเป็นวิดีโอ (YouTube)
                        modal.style.display = "flex";
                        modalVideo.style.display = "block";
                        modalImg.style.display = "none";
                        modalVideo.src = e.target.src; // ดึงลิงก์จาก iframe จิ๋วมาใส่ในอันใหญ่
                    }
                }
            };
        }

    } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error);
        if (logContainer) logContainer.innerHTML = "เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheets";
    }
}



// มั่นใจว่า DOM โหลดเสร็จก่อนค่อยเริ่มทำงาน
window.onload = initDetailsPage;