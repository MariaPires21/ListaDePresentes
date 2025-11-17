// Elementos da interface
const tabBtns = document.querySelectorAll('.tab-btn');
const formSection = document.getElementById('form');
const viewSection = document.getElementById('view');
const wishForm = document.getElementById('wishForm');
const wishList = document.getElementById('wishList');

// Alternar entre abas
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remover classe active de todas as abas
        tabBtns.forEach(b => b.classList.remove('active'));
        // Adicionar classe active à aba clicada
        btn.classList.add('active');

        // Mostrar a seção correspondente
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

// Carregar desejos do localStorage
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
    wishes.forEach((wish, index) => {
        const wishCard = document.createElement('div');
        wishCard.className = 'wish-card';
        wishCard.setAttribute('data-wish-index', index);

        let imageHtml = '';

        // Verificar se tem múltiplas imagens
        if (wish.images && wish.images.length > 0) {
            // MÚLTIPLAS IMAGENS - Com setas
            imageHtml = `
                <div class="wish-images-container">
                    ${wish.images.map((image, imgIndex) => `
                        <div class="image-wrapper ${imgIndex === 0 ? 'active' : ''}" 
                             style="display: ${imgIndex === 0 ? 'flex' : 'none'}"
                             data-image-index="${imgIndex}">
                            <img src="${image}" 
                                 alt="Presente ${imgIndex + 1} desejado por ${wish.name}" 
                                 class="wish-image"
                                 onload="handleImageLoad(this)"
                                 onerror="this.style.display='none'">
                        </div>
                    `).join('')}
                    
                    ${wish.images.length > 1 ? `
                        <div class="image-counter">
                            <span class="current-image">1</span> / <span class="total-images">${wish.images.length}</span>
                        </div>
                        <button class="nav-btn prev-btn" onclick="navigateImages(${index}, -1)">‹</button>
                        <button class="nav-btn next-btn" onclick="navigateImages(${index}, 1)">›</button>
                    ` : ''}
                </div>
            `;
        } else if (wish.image) {
            // UMA ÚNICA IMAGEM
            imageHtml = `
                <div class="wish-images-container">
                    <div class="image-wrapper active" style="display: flex">
                        <img src="${wish.image}" 
                             alt="Presente desejado por ${wish.name}" 
                             class="wish-image"
                             onload="handleImageLoad(this)"
                             onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\"height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;\">❌ Erro na imagem</div>'">
                    </div>
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
                ${wish.images && wish.images.length > 1 ? `
                    <small class="photos-hint">
                        📸 ${wish.images.length} foto(s) - Use as setas para navegar
                    </small>
                ` : ''}
            </div>
        `;

        wishList.appendChild(wishCard);
    });
}

// Função para centralizar imagens verticais
function handleImageLoad(imgElement) {
    const wrapper = imgElement.parentElement;

    // Verificar se a imagem é vertical
    if (imgElement.naturalHeight > imgElement.naturalWidth) {
        wrapper.classList.add('vertical-image');
    } else {
        wrapper.classList.add('horizontal-image');
    }
}

// Navegação entre imagens
function navigateImages(wishIndex, direction) {
    const wishCard = document.querySelector(`[data-wish-index="${wishIndex}"]`);
    if (!wishCard) return;

    const container = wishCard.querySelector('.wish-images-container');
    const wrappers = container.querySelectorAll('.image-wrapper');
    const currentIndex = Array.from(wrappers).findIndex(wrapper => wrapper.style.display === 'flex');
    const totalImages = wrappers.length;

    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = totalImages - 1;
    if (newIndex >= totalImages) newIndex = 0;

    // Esconder todas as imagens
    wrappers.forEach(wrapper => wrapper.style.display = 'none');
    // Mostrar apenas a imagem atual
    wrappers[newIndex].style.display = 'flex';

    // Atualizar contador
    const counter = container.querySelector('.current-image');
    if (counter) {
        counter.textContent = newIndex + 1;
    }
}

// FUNÇÃO MELHORADA para comprimir imagens
function compressImage(file) {
    return new Promise((resolve, reject) => {
        // Verificar tamanho primeiro
        if (file.size > 10 * 1024 * 1024) { // 10MB
            alert('❌ Esta imagem é muito grande! Escolha uma imagem menor que 10MB.');
            reject(new Error('Imagem muito grande'));
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Tamanho máximo reduzido
                const MAX_SIZE = 400;
                let width = img.width;
                let height = img.height;

                // Redimensionar mantendo proporção
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

                // Comprimir imagem
                ctx.drawImage(img, 0, 0, width, height);

                // Qualidade reduzida para arquivo menor
                try {
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    console.log('✅ Imagem comprimida com sucesso');
                    resolve(compressedBase64);
                } catch (error) {
                    console.error('❌ Erro na compressão:', error);
                    // Fallback: usar imagem original
                    resolve(e.target.result);
                }
            };

            img.onerror = function () {
                console.error('❌ Erro ao carregar imagem');
                alert('❌ Erro ao processar a imagem. Tente outra imagem.');
                reject(new Error('Erro ao carregar imagem'));
            };

            img.src = e.target.result;
        };

        reader.onerror = function (error) {
            console.error('❌ Erro ao ler arquivo:', error);
            alert('❌ Não foi possível ler a imagem. Tente outro arquivo.');
            reject(error);
        };

        reader.readAsDataURL(file);
    });
}

// Processar envio do formulário - VERSÃO CORRIGIDA
wishForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const wish = document.getElementById('wish').value.trim();
    const imageFiles = document.getElementById('image').files;

    // Validação básica
    if (!name || !wish) {
        alert('Por favor, preencha seu nome e seu desejo!');
        return;
    }

    // Verificar se já existe um desejo com este nome
    const wishes = JSON.parse(localStorage.getItem('familyWishes')) || [];
    const existingIndex = wishes.findIndex(item => item.name.toLowerCase() === name.toLowerCase());

    if (existingIndex !== -1) {
        if (confirm(`${name}, você já adicionou um desejo. Deseja substituí-lo?`)) {
            wishes.splice(existingIndex, 1);
        } else {
            return;
        }
    }

    try {
        let imagesBase64 = [];

        // Processar múltiplas imagens
        if (imageFiles.length > 0) {
            console.log('🖼️ Processando', imageFiles.length, 'imagem(ns)...');

            // Mostrar feedback para o usuário
            const submitButton = wishForm.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '⏳ Comprimindo imagens...';
            submitButton.disabled = true;

            // Processar cada imagem
            for (let i = 0; i < imageFiles.length; i++) {
                try {
                    console.log(`📸 Processando imagem ${i + 1}/${imageFiles.length}`);

                    const compressedImage = await compressImage(imageFiles[i]);
                    imagesBase64.push(compressedImage);
                    console.log('✅ Imagem', i + 1, 'processada com sucesso');

                    // Atualizar feedback
                    submitButton.innerHTML = `⏳ Processando... (${i + 1}/${imageFiles.length})`;

                    // Limitar a 5 imagens no máximo
                    if (imagesBase64.length >= 5) {
                        alert('⚠️ Máximo de 5 imagens atingido. As demais serão ignoradas.');
                        break;
                    }

                } catch (imageError) {
                    console.error(`❌ Erro na imagem ${i + 1}:`, imageError);
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                    return;
                }
            }

            // Restaurar botão
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }

        // Criar novo desejo
        const newWish = {
            name: name,
            wish: wish,
            date: new Date().toISOString()
        };

        // Adicionar imagens (múltiplas ou única)
        if (imagesBase64.length > 0) {
            newWish.images = imagesBase64;
            // Para compatibilidade com versões antigas
            if (imagesBase64.length === 1) {
                newWish.image = imagesBase64[0];
            }
        }

        wishes.push(newWish);
        localStorage.setItem('familyWishes', JSON.stringify(wishes));

        alert('🎄 Seu desejo foi adicionado com sucesso!' + (imagesBase64.length > 0 ? ` (${imagesBase64.length} foto(s))` : ''));
        wishForm.reset();

        // Mudar para a aba de visualização
        document.querySelector('[data-tab="view"]').click();

    } catch (error) {
        console.error('❌ Erro geral:', error);
        alert('❌ Erro ao adicionar desejo. Tente novamente.');
    }
});

// Carregar desejos ao abrir a página
document.addEventListener('DOMContentLoaded', loadWishes);  