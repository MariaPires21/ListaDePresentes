// Elementos da interface
const tabBtns = document.querySelectorAll('.tab-btn');
const formSection = document.getElementById('form');
const viewSection = document.getElementById('view');
const wishForm = document.getElementById('wishForm');
const wishList = document.getElementById('wishList');

// Alternar entre abas
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tabId = btn.getAttribute('data-tab');
        formSection.classList.remove('active');
        viewSection.classList.remove('active');

        if (tabId === 'form') {
            formSection.classList.add('active');
        } else {
            viewSection.classList.add('active');
            loadWishes();
        }
    });
});

// Função para carregar desejos - CORRIGIDA
function loadWishes() {
    const wishes = JSON.parse(localStorage.getItem('familyWishes')) || [];

    if (wishes.length === 0) {
        wishList.innerHTML = `
            <div class="empty-state">
                <div>📝</div>
                <h3>Nenhum desejo adicionado ainda</h3>
                <p>Seja o primeiro a compartilhar seus desejos de Natal!</p>
            </div>
        `;
        return;
    }

    wishList.innerHTML = '';
    
    wishes.forEach((wish, wishIndex) => {
        const wishCard = document.createElement('div');
        wishCard.className = 'wish-card';
        wishCard.setAttribute('data-wish-index', wishIndex);

        let imageHtml = '';
        
        // VERIFICAR SE TEM IMAGENS
        const images = wish.images || (wish.image ? [wish.image] : []);
        
        if (images.length > 0) {
            // MÚLTIPLAS IMAGENS - CARROSSEL
            imageHtml = `
                <div class="wish-images-container">
                    ${images.map((image, imgIndex) => `
                        <div class="image-wrapper ${imgIndex === 0 ? 'active' : ''}" 
                             style="display: ${imgIndex === 0 ? 'flex' : 'none'}"
                             data-image-index="${imgIndex}">
                            <img src="${image}" 
                                 alt="Presente de ${wish.name}" 
                                 class="wish-image"
                                 onload="this.parentElement.classList.add('image-loaded')"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
                            <div style="display: none; text-align: center; color: #999; font-size: 0.9rem;">❌ Erro na imagem</div>
                        </div>
                    `).join('')}
                    
                    ${images.length > 1 ? `
                        <div class="image-counter">
                            <span class="current-image">1</span>/<span class="total-images">${images.length}</span>
                        </div>
                        <button class="nav-btn prev-btn" onclick="navigateImages(${wishIndex}, -1)">‹</button>
                        <button class="nav-btn next-btn" onclick="navigateImages(${wishIndex}, 1)">›</button>
                    ` : ''}
                </div>
            `;
        } else {
            // SEM IMAGEM
            imageHtml = `
                <div class="wish-images-container">
                    <div class="no-image-placeholder">
                        <div class="gift-emoji">🎁</div>
                        <div class="no-image-text">Sem imagem</div>
                    </div>
                </div>
            `;
        }

        wishCard.innerHTML = `
            ${imageHtml}
            <div class="wish-info">
                <div class="wish-name">${wish.name}</div>
                <div class="wish-description">${wish.wish}</div>
                ${images.length > 1 ? `
                    <small class="photos-hint">📸 ${images.length} foto(s) - Use as setas para navegar</small>
                ` : ''}
            </div>
        `;

        wishList.appendChild(wishCard);
    });
}

// Função de navegação - CORRIGIDA
function navigateImages(wishIndex, direction) {
    const wishCard = document.querySelector(`.wish-card[data-wish-index="${wishIndex}"]`);
    if (!wishCard) return;
    
    const container = wishCard.querySelector('.wish-images-container');
    const wrappers = container.querySelectorAll('.image-wrapper');
    const totalImages = wrappers.length;
    
    if (totalImages <= 1) return;
    
    // Encontrar imagem atual
    let currentIndex = -1;
    wrappers.forEach((wrapper, index) => {
        if (wrapper.style.display === 'flex' || wrapper.classList.contains('active')) {
            currentIndex = index;
        }
    });
    
    if (currentIndex === -1) currentIndex = 0;
    
    // Calcular nova imagem
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = totalImages - 1;
    if (newIndex >= totalImages) newIndex = 0;
    
    // Esconder todas, mostrar apenas a atual
    wrappers.forEach(wrapper => {
        wrapper.style.display = 'none';
        wrapper.classList.remove('active');
    });
    
    wrappers[newIndex].style.display = 'flex';
    wrappers[newIndex].classList.add('active');
    
    // Atualizar contador
    const counter = container.querySelector('.current-image');
    if (counter) {
        counter.textContent = newIndex + 1;
    }
}

// Função para comprimir imagens
function compressImage(file) {
    return new Promise((resolve, reject) => {
        if (file.size > 10 * 1024 * 1024) {
            alert('❌ Imagem muito grande! Escolha uma menor que 10MB.');
            reject(new Error('Imagem muito grande'));
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const MAX_SIZE = 400;
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > MAX_SIZE) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                try {
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(compressedBase64);
                } catch (error) {
                    resolve(e.target.result);
                }
            };
            
            img.onerror = function() {
                reject(new Error('Erro ao carregar imagem'));
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Processar envio do formulário - CORRIGIDO
wishForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const wish = document.getElementById('wish').value.trim();
    const imageFiles = document.getElementById('image').files;

    if (!name || !wish) {
        alert('Por favor, preencha seu nome e seu desejo!');
        return;
    }

    // Verificar se já existe
    const wishes = JSON.parse(localStorage.getItem('familyWishes')) || [];
    const existingIndex = wishes.findIndex(item => item.name.toLowerCase() === name.toLowerCase());

    if (existingIndex !== -1) {
        if (!confirm(`${name}, você já adicionou um desejo. Deseja substituí-lo?`)) {
            return;
        }
        wishes.splice(existingIndex, 1);
    }

    try {
        let imagesBase64 = [];
        
        if (imageFiles.length > 0) {
            // Mostrar feedback
            const submitButton = wishForm.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '⏳ Processando imagens...';
            submitButton.disabled = true;

            // Processar cada imagem
            for (let i = 0; i < imageFiles.length; i++) {
                try {
                    const compressedImage = await compressImage(imageFiles[i]);
                    imagesBase64.push(compressedImage);
                    
                    if (imagesBase64.length >= 5) {
                        alert('⚠️ Máximo de 5 imagens!');
                        break;
                    }
                } catch (error) {
                    console.error('Erro na imagem:', error);
                    alert(`❌ Erro na imagem ${i + 1}. Tente outra.`);
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                    return;
                }
            }
            
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }

        // Criar desejo
        const newWish = {
            name: name,
            wish: wish,
            date: new Date().toISOString()
        };

        // Adicionar imagens
        if (imagesBase64.length > 0) {
            newWish.images = imagesBase64;
        }

        wishes.push(newWish);
        localStorage.setItem('familyWishes', JSON.stringify(wishes));

        alert('🎄 Desejo adicionado!' + (imagesBase64.length > 0 ? ` (${imagesBase64.length} foto(s))` : ''));
        wishForm.reset();
        document.querySelector('[data-tab="view"]').click();

    } catch (error) {
        console.error('Erro geral:', error);
        alert('❌ Erro ao adicionar desejo.');
    }
});

// Carregar ao abrir a página
document.addEventListener('DOMContentLoaded', loadWishes);