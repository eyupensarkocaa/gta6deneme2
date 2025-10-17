// ======================================================================
// !!! DİKKAT: BU TEST SÜRÜMÜDÜR !!! 
// Gerçek projede, bu Base64 kodlarını kendi sunucunuzdaki 100+ görüntü URL'si ile değiştirin.
// ======================================================================

// Basit test için örnek Base64 görüntüsü (Siyah bir arka planda ortada beyaz bir kare)
const TEST_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABf+fvLAAAABHNCSO3sZDAXNURRUV'; // Kısaltıldı, tam hali kodda daha uzun olacak

// Test için farklı görsel varyasyonları oluşturuyoruz.
const createTestImage = (color, text) => {
    // Canvas üzerinde basit bir test görüntüsü oluşturma fonksiyonu
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1920;
    tempCanvas.height = 1080;
    const ctx = tempCanvas.getContext('2d');

    // Arka plan rengi
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 1920, 1080);

    // Ana şekil
    ctx.fillStyle = color;
    ctx.fillRect(460, 290, 1000, 500);

    // Metin
    ctx.fillStyle = 'white';
    ctx.font = 'bold 150px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, 960, 540);

    return tempCanvas.toDataURL();
};

const BASE64_IMAGES = {
    SECTION_1: createTestImage('rgba(255, 0, 0, 0.8)', 'Bölüm 1'),
    SECTION_2: createTestImage('rgba(0, 255, 0, 0.8)', 'Bölüm 2'),
    SECTION_3: createTestImage('rgba(0, 0, 255, 0.8)', 'Bölüm 3'),
};

// --- AYARLARINIZI BURADAN YAPIN ---
const FRAME_COUNT_PER_SECTION = 15; // Test için düşük sayı (Gerçekte >100 olmalı)

const SECTION_INFOS = [
    // Her bölümde aynı Base64 görselini kullanacağız. Animasyon, bu görselin CSS transformasyonları ile yapılacak
    { prefix: 'b1_', count: FRAME_COUNT_PER_SECTION, spacerId: '#spacer-1', sectionId: '#section-1', base64: BASE64_IMAGES.SECTION_1 },
    { prefix: 'b2_', count: FRAME_COUNT_PER_SECTION, spacerId: '#spacer-2', sectionId: '#section-2', base64: BASE64_IMAGES.SECTION_2 },
    { prefix: 'b3_', count: FRAME_COUNT_PER_SECTION, spacerId: '#spacer-3', sectionId: '#section-3', base64: BASE64_IMAGES.SECTION_3 },
];

const canvas = document.getElementById('image-sequence');
const context = canvas.getContext('2d');

let frameIndex = 0;
const images = [];

// Görüntü Dizilerini Önceden Yükleme Fonksiyonu
function preloadImages(sectionInfos) {
    let loadedCount = 0;
    const totalCount = sectionInfos.reduce((sum, section) => sum + section.count, 0);

    return new Promise(resolve => {
        sectionInfos.forEach((section, sectionIndex) => {
            images[sectionIndex] = [];
            
            for (let i = 1; i <= section.count; i++) {
                const img = new Image();
                // Base64 görselini kullan
                img.src = section.base64;
                
                img.onload = () => {
                    loadedCount++;
                    if (loadedCount === totalCount) {
                        resolve();
                    }
                };
                
                // Görüntüye basit bir "kaydırma" efekti vermek için her kareyi farklı ölçekte tutuyoruz
                // Bu, gerçek projede farklı olan asıl karelerinizin yerini simüle eder.
                const scale = 1 + (i / section.count) * 0.5; // 1.0x'dan 1.5x'e zoom
                const offsetX = -((i / section.count) * 100); // Hafif sola kaydırma simülasyonu
                
                images[sectionIndex].push({ 
                    img: img, 
                    scale: scale,
                    offsetX: offsetX 
                });
            }
        });
    });
}

// Canvas'ı Görüntüye Göre Ayarlama ve Çizme Fonksiyonu
function render(imageObject) {
    if (!imageObject || !imageObject.img) return;

    const img = imageObject.img;
    const scaleFactor = imageObject.scale; 
    const offsetX = imageObject.offsetX;
    
    // Canvas boyutunu ayarla
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Görüntünün yeni boyutları
    const imgWidth = img.width * scaleFactor;
    const imgHeight = img.height * scaleFactor;

    // Ortalamayı hesapla
    const startX = (canvas.width / 2) - (imgWidth / 2) + offsetX;
    const startY = (canvas.height / 2) - (imgHeight / 2);
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    // Görüntüyü yeni boyut ve konumda çiz
    context.drawImage(img, startX, startY, imgWidth, imgHeight);
}

// Canvas Boyutunu Ayarla (Ekran Değiştiğinde)
function resizeCanvas() {
    // Boyut değiştiğinde son kareyi tekrar çiz
    if (images.length > 0) {
        // En son çizilen kareyi bulmak karmaşık, bu yüzden sadece yeniden boyutlandırıyoruz.
        // Animasyon zaten ScrollTrigger ile kontrol edildiği için kendiliğinden düzelir.
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}
window.addEventListener('resize', resizeCanvas);


// Tüm görüntüler (Base64) yüklendiğinde ScrollTrigger'ı başlat
preloadImages(SECTION_INFOS).then(() => {
    console.log("Test görselleri oluşturuldu. Animasyon Başlatılıyor.");

    // İlk kareyi çiz
    if (images[0] && images[0][0]) {
        render(images[0][0]);
    }
    
    SECTION_INFOS.forEach((section, sectionIndex) => {
        
        // 1. ScrollTrigger: Görüntü Dizisi Animasyonu
        gsap.to({ scrollFrame: 0 }, {
            scrollFrame: section.count - 1,
            ease: "none",
            
            scrollTrigger: {
                trigger: section.spacerId,
                start: "top top",
                end: "bottom top",
                scrub: 0.5, 
                
                onUpdate: (self) => {
                    const currentFrame = Math.floor(self.progress * (section.count - 1));
                    
                    if (currentFrame !== frameIndex) {
                        frameIndex = currentFrame;
                        // O anki bölümün ilgili karesini çiz
                        render(images[sectionIndex][frameIndex]);
                    }
                },
                // markers: true 
            }
        });
        
        // 2. ScrollTrigger: Metin İçeriği Animasyonu (Opacity)
        gsap.timeline({
            scrollTrigger: {
                trigger: section.spacerId,
                start: "top top",
                end: "bottom top",
                scrub: true,
                // markers: true
            }
        })
        .to(section.sectionId, { opacity: 1, duration: 0.1 }, 0) 
        .to(section.sectionId, { opacity: 0, duration: 0.1 }, 0.9); 
    });
});