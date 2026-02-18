const urlPage2 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0YgI2aCwhv3X9Xnr3mHGTrwuecgUSOSCdPe386FTRibXNYW-Cb5piYnlxlTd0tcIkp_m3PXaUMWLj/pub?gid=139768779&single=true&output=csv';

// --- ตัวแปร Global ---
let currentImageIndex = 0;
let currentGallery = []; 
let scale = 1;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;

async function initDetailsPage() {
    console.log("เริ่มทำงาน: initDetailsPage");
    
    const urlParams = new URLSearchParams(window.location.search);
    const targetTopic = urlParams.get('topic');
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
        const rows = data.split(/\r?\n(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        let htmlContent = "";
        const cleanTarget = targetTopic.replace(/\s/g, '');
        const dataRows = rows.slice(1).reverse();

        dataRows.forEach((row) => {
            const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (columns.length < 5) return;

            const topicInSheet = columns[1] ? columns[1].replace(/"/g, '').trim() : "";
            const cleanSheetTopic = topicInSheet.replace(/\s/g, '');

            if (cleanSheetTopic === cleanTarget) {
                const dateRaw = columns[0].replace(/"/g, '').trim();
                const staff = columns[2].replace(/"/g, '').trim();
                const step = columns[3].replace(/"/g, '').trim();
                const detail = columns[4].replace(/"/g, '').trim();

                let imageHtmlRaw = columns[5] ? columns[5].replace(/"/g, '') : "";
                // จัดระเบียบ Iframe ให้มี Class media-thumb ครอบ
                let imageHtml = imageHtmlRaw.replace(/<iframe/g, '<div class="media-thumb"><iframe').replace(/<\/iframe>/g, '</iframe></div>');

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
            setupZoomAndDrag();

            logContainer.onclick = function(e) {
            // 1. หาว่าคลิกอยู่ในโพสต์ไหน
            const parentEntry = e.target.closest('.log-entry');
            if (!parentEntry) return;

                // 2. สแกนหารูปและวิดีโอทั้งหมดในโพสต์นั้นเพื่อสร้าง Gallery ชั่วคราว
                const allMedia = parentEntry.querySelectorAll('img, iframe');
    
                currentGallery = Array.from(allMedia).map(el => ({
                type: el.tagName.toLowerCase(),
                src: el.getAttribute('src')
                }));

            let clickedSrc = "";

            // 3. ตรวจสอบว่าคลิกโดนอะไร
            if (e.target.tagName === 'IMG') {
                // กรณีคลิกโดนรูป
                clickedSrc = e.target.getAttribute('src');
            } else {
                // กรณีคลิกโดนกรอบวิดีโอ (media-thumb)
                const thumb = e.target.closest('.media-thumb');
            if (thumb) {
                const iframe = thumb.querySelector('iframe');
                // *** จุดที่แก้: เปลี่ยน iframeInside เป็น iframe เฉยๆ ***
            if (iframe) {
                clickedSrc = iframe.getAttribute('src');
            }
        }
    }

    // 4. หา Index และเปิด Modal
    currentImageIndex = currentGallery.findIndex(item => item.src === clickedSrc);
    
    console.log("Clicked Src:", clickedSrc); 
    console.log("Index found:", currentImageIndex);

    if (currentImageIndex !== -1) {
        openModal(currentImageIndex);
    }
};
        }

    } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error);
    }
}

// --- ฟังก์ชันแสดงสื่อใน Modal ---
function displayMedia(index) {
    const modalImg = document.getElementById('modalImg');
    const modalVideo = document.getElementById('modalVideo');
    const zoomButtons = document.getElementById('zoom-controls');
    const media = currentGallery[index];

    if (!media) return;

    // ล้างค่าเก่าออกก่อนทุกครั้งเพื่อความชัวร์
    modalImg.src = "";
    if (modalVideo) modalVideo.src = "";

    if (media.type === 'img') {
        modalImg.style.display = "block";
        modalVideo.style.display = "none";
        modalImg.src = media.src;
        if (zoomButtons) zoomButtons.style.display = "flex";
        resetZoom();
    } else {
        // ส่วนของ Iframe (3D/Video)
        modalImg.style.display = "none";
        modalVideo.style.display = "block";
        modalVideo.src = media.src; // ส่งลิงก์เข้า iframe
        if (zoomButtons) zoomButtons.style.display = "none";
    }
    updateNavButtons();
}

function openModal(index) {
    const modal = document.getElementById('imageModal');
    if (!modal) return;
    modal.style.display = "flex";
    displayMedia(index);
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    const modalVideo = document.getElementById('modalVideo');
    const modalImg = document.getElementById('modalImg');
    
    if (modal) modal.style.display = "none";
    if (modalImg) modalImg.src = "";
    if (modalVideo) {
        modalVideo.src = ""; 
        modalVideo.style.display = "none";
    }
}

function changeImage(n) {
    const newIndex = currentImageIndex + n;
    if (newIndex >= 0 && newIndex < currentGallery.length) {
        currentImageIndex = newIndex;
        displayMedia(currentImageIndex);
    }
}

function updateNavButtons() {
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    if (prevBtn) prevBtn.style.visibility = (currentImageIndex === 0) ? "hidden" : "visible";
    if (nextBtn) nextBtn.style.visibility = (currentImageIndex === currentGallery.length - 1) ? "hidden" : "visible";
}

// --- ระบบ Zoom & Drag ---
function setupZoomAndDrag() {
    const modalImg = document.getElementById('modalImg');
    if (!modalImg) return;

    modalImg.onmousedown = (e) => {
        if (scale > 1) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            modalImg.style.cursor = "grabbing";
            e.preventDefault();
        }
    };

    window.onmousemove = (e) => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        applyTransform();
    };

    window.onmouseup = () => {
        isDragging = false;
        if(modalImg) modalImg.style.cursor = scale > 1 ? "grab" : "default";
    };
}

function zoom(amount) { scale += amount; if (scale < 1) scale = 1; applyTransform(); }
function resetZoom() { scale = 1; translateX = 0; translateY = 0; applyTransform(); }
function applyTransform() {
    const img = document.getElementById('modalImg');
    if (img) {
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        img.style.cursor = scale > 1 ? "grab" : "default";
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('imageModal');
    if (event.target === modal) closeModal();
};

window.onload = initDetailsPage;